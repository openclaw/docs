---
read_when:
    - Sie möchten reproduzierbare, zurücksetzbare Installationen
    - Sie verwenden bereits Nix/NixOS/Home Manager
    - Sie möchten alles festschreiben und deklarativ verwalten
summary: OpenClaw deklarativ mit Nix installieren
title: Nix
x-i18n:
    generated_at: "2026-05-06T06:53:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0c25b97fb46a906bb726a13de095ead1e6c3642d28f66173b488acfbc5e0001
    source_path: install/nix.md
    workflow: 16
---

Installieren Sie OpenClaw deklarativ mit **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** - einem umfassend ausgestatteten Home Manager-Modul.

<Info>
Das [nix-openclaw](https://github.com/openclaw/nix-openclaw)-Repo ist die maßgebliche Quelle für die Nix-Installation. Diese Seite bietet einen kurzen Überblick.
</Info>

## Was Sie erhalten

- Gateway + macOS-App + Tools (whisper, spotify, cameras) -- alles fest versioniert
- launchd-Dienst, der Neustarts übersteht
- Plugin-System mit deklarativer Konfiguration
- Sofortiges Rollback: `home-manager switch --rollback`

## Schnellstart

<Steps>
  <Step title="Determinate Nix installieren">
    Wenn Nix noch nicht installiert ist, folgen Sie den Anweisungen des [Determinate Nix installer](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Lokale Flake erstellen">
    Verwenden Sie das agent-first-Template aus dem nix-openclaw-Repo:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Geheimnisse konfigurieren">
    Richten Sie Ihr Messaging-Bot-Token und den API-Schlüssel Ihres Modell-Providers ein. Einfache Dateien unter `~/.secrets/` funktionieren problemlos.
  </Step>
  <Step title="Template-Platzhalter ausfüllen und wechseln">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Überprüfen">
    Bestätigen Sie, dass der launchd-Dienst läuft und Ihr Bot auf Nachrichten antwortet.
  </Step>
</Steps>

Im [nix-openclaw README](https://github.com/openclaw/nix-openclaw) finden Sie alle Moduloptionen und Beispiele.

## Laufzeitverhalten im Nix-Modus

Wenn `OPENCLAW_NIX_MODE=1` gesetzt ist (automatisch mit nix-openclaw), wechselt OpenClaw in einen deterministischen Modus, der Auto-Installationsabläufe deaktiviert.

Sie können dies auch manuell setzen:

```bash
export OPENCLAW_NIX_MODE=1
```

Unter macOS übernimmt die GUI-App Shell-Umgebungsvariablen nicht automatisch. Aktivieren Sie den Nix-Modus stattdessen über Defaults:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Was sich im Nix-Modus ändert

- Auto-Installations- und Selbstmutationsabläufe sind deaktiviert
- Fehlende Abhängigkeiten zeigen Nix-spezifische Behebungsmeldungen an
- Die UI zeigt ein schreibgeschütztes Banner für den Nix-Modus an

### Konfigurations- und Zustandspfade

OpenClaw liest die JSON5-Konfiguration aus `OPENCLAW_CONFIG_PATH` und speichert veränderliche Daten in `OPENCLAW_STATE_DIR`. Wenn OpenClaw unter Nix läuft, setzen Sie diese Werte explizit auf von Nix verwaltete Speicherorte, damit Laufzeitzustand und Konfiguration außerhalb des unveränderlichen Stores bleiben.

| Variable               | Standard                                |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Service-PATH-Erkennung

Der launchd-/systemd-Gateway-Dienst erkennt Nix-Profil-Binärdateien automatisch, sodass
Plugins und Tools, die per Shell auf mit `nix` installierte ausführbare Dateien zugreifen, ohne
manuelle PATH-Einrichtung funktionieren:

- Wenn `NIX_PROFILES` gesetzt ist, wird jeder Eintrag dem Service-PATH mit
  Priorität von rechts nach links hinzugefügt (entspricht der Nix-Shell-Priorität - der rechteste Eintrag gewinnt).
- Wenn `NIX_PROFILES` nicht gesetzt ist, wird `~/.nix-profile/bin` als Fallback hinzugefügt.

Dies gilt sowohl für macOS-launchd- als auch für Linux-systemd-Dienstumgebungen.

## Verwandt

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Maßgebliches Home Manager-Modul und vollständige Einrichtungsanleitung.
  </Card>
  <Card title="Einrichtungsassistent" href="/de/start/wizard" icon="wand-magic-sparkles">
    Anleitung zur Nicht-Nix-Einrichtung über die CLI.
  </Card>
  <Card title="Docker" href="/de/install/docker" icon="docker">
    Containerisierte Einrichtung als Nicht-Nix-Alternative.
  </Card>
  <Card title="Aktualisierung" href="/de/install/updating" icon="arrow-up-right-from-square">
    Aktualisierung von über Home Manager verwalteten Installationen zusammen mit dem Paket.
  </Card>
</CardGroup>
