---
read_when:
    - Sie möchten reproduzierbare Installationen mit Rollback-Möglichkeit.
    - Sie verwenden bereits Nix/NixOS/Home Manager
    - Sie möchten alles fest auf bestimmte Versionen festlegen und deklarativ verwalten.
summary: OpenClaw deklarativ mit Nix installieren
title: Nix
x-i18n:
    generated_at: "2026-07-12T01:47:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f74e259ec3d909c73d9184db24d236135db04c29c2e7fab9be9e6fa7f98ba91
    source_path: install/nix.md
    workflow: 16
---

Installieren Sie OpenClaw deklarativ mit **[nix-openclaw](https://github.com/openclaw/nix-openclaw)**, dem offiziellen, vollständig ausgestatteten Home-Manager-Modul.

<Info>
Das Repository [nix-openclaw](https://github.com/openclaw/nix-openclaw) ist die maßgebliche Quelle für die Nix-Installation. Diese Seite bietet einen kurzen Überblick.
</Info>

## Enthaltene Komponenten

- Gateway + macOS-App + Werkzeuge (Whisper, Spotify, Kameras), alle auf feste Versionen gesetzt
- Launchd-Dienst, der Neustarts übersteht
- Plugin-System mit deklarativer Konfiguration
- Sofortiges Rollback: `home-manager switch --rollback`

## Schnellstart

<Steps>
  <Step title="Determinate Nix installieren">
    Wenn Nix noch nicht installiert ist, folgen Sie den Anweisungen des [Determinate-Nix-Installationsprogramms](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Lokalen Flake erstellen">
    Verwenden Sie die agentenorientierte Vorlage aus dem Repository nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Vorlage templates/agent-first/flake.nix aus dem Repository nix-openclaw kopieren
    ```
  </Step>
  <Step title="Geheimnisse konfigurieren">
    Richten Sie das Token Ihres Messaging-Bots und den API-Schlüssel des Modell-Providers ein. Einfache Dateien unter `~/.secrets/` sind dafür ausreichend.
  </Step>
  <Step title="Platzhalter in der Vorlage ausfüllen und Konfiguration aktivieren">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Überprüfen">
    Vergewissern Sie sich, dass der Launchd-Dienst ausgeführt wird und Ihr Bot auf Nachrichten antwortet.
  </Step>
</Steps>

Vollständige Moduloptionen und Beispiele finden Sie in der [README von nix-openclaw](https://github.com/openclaw/nix-openclaw).

## Laufzeitverhalten im Nix-Modus

Wenn `OPENCLAW_NIX_MODE=1` gesetzt ist (bei nix-openclaw automatisch), wechselt OpenClaw für von Nix verwaltete Installationen in einen deterministischen Modus. Andere Nix-Pakete können denselben Modus festlegen; nix-openclaw ist die offizielle Referenzimplementierung.

Sie können ihn auch manuell festlegen:

```bash
export OPENCLAW_NIX_MODE=1
```

Unter macOS übernimmt die grafische App keine Umgebungsvariablen der Shell. Aktivieren Sie den Nix-Modus stattdessen über `defaults`:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Änderungen im Nix-Modus

- Abläufe zur automatischen Installation und Selbstmodifikation sind deaktiviert.
- `openclaw.json` wird als unveränderlich behandelt. Beim Start abgeleitete Standardwerte gelten nur zur Laufzeit, und Konfigurationsschreiber (Einrichtung, Onboarding, veränderndes `openclaw update`, Installation/Aktualisierung/Deinstallation/Aktivierung von Plugins, `doctor --fix`, `doctor --generate-gateway-token`, `openclaw config set`) verweigern die Bearbeitung der Datei.
- Bearbeiten Sie stattdessen die Nix-Quelle. Verwenden Sie für nix-openclaw den agentenorientierten [Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start) und legen Sie die Konfiguration unter `programs.openclaw.config` oder `instances.<name>.config` fest.
- Fehlende Abhängigkeiten werden mit Nix-spezifischen Hinweisen zur Behebung gemeldet.
- Die Benutzeroberfläche zeigt ein schreibgeschütztes Banner für den Nix-Modus an.

### Pfade für Konfiguration und Zustand

OpenClaw liest die JSON5-Konfiguration aus `OPENCLAW_CONFIG_PATH` und speichert veränderliche Daten in `OPENCLAW_STATE_DIR`. Legen Sie diese unter Nix explizit auf von Nix verwaltete Speicherorte fest, damit Laufzeitdaten und Konfiguration nicht im unveränderlichen Store gespeichert werden.

| Variable               | Standardwert                            |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### PATH-Ermittlung für Dienste

Der Launchd-/systemd-Gateway-Dienst erkennt Binärdateien in Nix-Profilen automatisch, sodass Plugins und Werkzeuge, die über die Shell mit `nix` installierte ausführbare Dateien aufrufen, ohne manuelle PATH-Einrichtung funktionieren:

- Wenn `NIX_PROFILES` gesetzt ist, wird jeder Eintrag mit einer Priorität von rechts nach links zum Dienst-PATH hinzugefügt (entspricht der Priorität in der Nix-Shell: Der Eintrag ganz rechts hat Vorrang).
- Wenn `NIX_PROFILES` nicht gesetzt ist, wird ersatzweise `~/.nix-profile/bin` hinzugefügt.

Dies gilt sowohl für Launchd-Dienstumgebungen unter macOS als auch für systemd-Dienstumgebungen unter Linux.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Maßgebliches Home-Manager-Modul und vollständige Einrichtungsanleitung.
  </Card>
  <Card title="Einrichtungsassistent" href="/de/start/wizard" icon="wand-magic-sparkles">
    Schritt-für-Schritt-Anleitung zur CLI-Einrichtung ohne Nix.
  </Card>
  <Card title="Docker" href="/de/install/docker" icon="docker">
    Containerbasierte Einrichtung als Alternative zu Nix.
  </Card>
  <Card title="Aktualisierung" href="/de/install/updating" icon="arrow-up-right-from-square">
    Aktualisierung von durch Home Manager verwalteten Installationen zusammen mit dem Paket.
  </Card>
</CardGroup>
