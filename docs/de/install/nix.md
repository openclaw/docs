---
read_when:
    - Sie möchten reproduzierbare Installationen, die sich zurücksetzen lassen
    - Sie verwenden bereits Nix/NixOS/Home Manager
    - Sie möchten alles fest versioniert und deklarativ verwaltet haben
summary: OpenClaw deklarativ mit Nix installieren
title: Nix
x-i18n:
    generated_at: "2026-07-24T05:07:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6f74e259ec3d909c73d9184db24d236135db04c29c2e7fab9be9e6fa7f98ba91
    source_path: install/nix.md
    workflow: 16
---

Installieren Sie OpenClaw deklarativ mit **[nix-openclaw](https://github.com/openclaw/nix-openclaw)**, dem offiziellen Home-Manager-Modul mit umfassender Ausstattung.

<Info>
Das Repository [nix-openclaw](https://github.com/openclaw/nix-openclaw) ist die maßgebliche Quelle für die Nix-Installation. Diese Seite bietet einen kurzen Überblick.
</Info>

## Leistungsumfang

- Gateway + macOS-App + Tools (whisper, spotify, Kameras), alle auf feste Versionen festgelegt
- Launchd-Dienst, der Neustarts übersteht
- Plugin-System mit deklarativer Konfiguration
- Sofortiges Rollback: `home-manager switch --rollback`

## Schnellstart

<Steps>
  <Step title="Determinate Nix installieren">
    Falls Nix noch nicht installiert ist, folgen Sie den Anweisungen des [Determinate-Nix-Installationsprogramms](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Lokalen Flake erstellen">
    Verwenden Sie die Agent-First-Vorlage aus dem nix-openclaw-Repository:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Vorlage templates/agent-first/flake.nix aus dem nix-openclaw-Repository kopieren
    ```
  </Step>
  <Step title="Secrets konfigurieren">
    Richten Sie das Token Ihres Messaging-Bots und den API-Schlüssel des Modell-Providers ein. Einfache Dateien unter `~/.secrets/` funktionieren problemlos.
  </Step>
  <Step title="Platzhalter der Vorlage ausfüllen und umstellen">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Überprüfen">
    Vergewissern Sie sich, dass der launchd-Dienst ausgeführt wird und Ihr Bot auf Nachrichten antwortet.
  </Step>
</Steps>

Vollständige Moduloptionen und Beispiele finden Sie in der [README zu nix-openclaw](https://github.com/openclaw/nix-openclaw).

## Laufzeitverhalten im Nix-Modus

Wenn `OPENCLAW_NIX_MODE=1` gesetzt ist (bei nix-openclaw automatisch), wechselt OpenClaw für Nix-verwaltete Installationen in einen deterministischen Modus. Andere Nix-Pakete können denselben Modus festlegen; nix-openclaw ist die offizielle Referenz.

Sie können ihn auch manuell festlegen:

```bash
export OPENCLAW_NIX_MODE=1
```

Unter macOS übernimmt die GUI-App keine Shell-Umgebungsvariablen. Aktivieren Sie den Nix-Modus stattdessen über `defaults`:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Änderungen im Nix-Modus

- Abläufe zur automatischen Installation und Selbstmodifikation sind deaktiviert.
- `openclaw.json` wird als unveränderlich behandelt. Beim Start abgeleitete Standardwerte gelten nur zur Laufzeit, und Konfigurationsschreiber (Einrichtung, Onboarding, verändernde `openclaw update`, Installation/Aktualisierung/Deinstallation/Aktivierung von Plugins, `doctor --fix`, `doctor --generate-gateway-token`, `openclaw config set`) verweigern die Bearbeitung der Datei.
- Bearbeiten Sie stattdessen die Nix-Quelle. Verwenden Sie für nix-openclaw den Agent-First-[Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start) und legen Sie die Konfiguration unter `programs.openclaw.config` oder `instances.<name>.config` fest.
- Bei fehlenden Abhängigkeiten werden Nix-spezifische Hinweise zur Problembehebung angezeigt.
- Die Benutzeroberfläche zeigt ein schreibgeschütztes Banner für den Nix-Modus an.

### Konfigurations- und Zustandspfade

OpenClaw liest die JSON5-Konfiguration aus `OPENCLAW_CONFIG_PATH` und speichert veränderliche Daten in `OPENCLAW_STATE_DIR`. Legen Sie diese unter Nix ausdrücklich auf Nix-verwaltete Speicherorte fest, damit Laufzeitzustand und Konfiguration außerhalb des unveränderlichen Stores bleiben.

| Variable               | Standardwert                            |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Ermittlung des Dienst-PATH

Der Gateway-Dienst von launchd/systemd erkennt Binärdateien in Nix-Profilen automatisch, sodass Plugins und Tools, die über die Shell von `nix` installierte ausführbare Dateien aufrufen, ohne manuelle PATH-Konfiguration funktionieren:

- Wenn `NIX_PROFILES` gesetzt ist, wird jeder Eintrag dem Dienst-PATH mit einer Priorität von rechts nach links hinzugefügt (entspricht der Priorität der Nix-Shell: Der am weitesten rechts stehende Eintrag gewinnt).
- Wenn `NIX_PROFILES` nicht gesetzt ist, wird `~/.nix-profile/bin` als Fallback hinzugefügt.

Dies gilt sowohl für macOS-launchd- als auch für Linux-systemd-Dienstumgebungen.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Maßgebliches Home-Manager-Modul und vollständige Einrichtungsanleitung.
  </Card>
  <Card title="Einrichtungsassistent" href="/de/start/wizard" icon="wand-magic-sparkles">
    Anleitung zur Einrichtung über die CLI ohne Nix.
  </Card>
  <Card title="Docker" href="/de/install/docker" icon="docker">
    Containerisierte Einrichtung als Alternative ohne Nix.
  </Card>
  <Card title="Aktualisierung" href="/de/install/updating" icon="arrow-up-right-from-square">
    Aktualisierung von durch Home Manager verwalteten Installationen zusammen mit dem Paket.
  </Card>
</CardGroup>
