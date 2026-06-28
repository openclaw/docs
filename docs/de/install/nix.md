---
read_when:
    - Sie möchten reproduzierbare Installationen mit Rollback-Möglichkeit
    - Sie verwenden bereits Nix/NixOS/Home Manager
    - Sie möchten, dass alles festgeschrieben und deklarativ verwaltet wird
summary: OpenClaw deklarativ mit Nix installieren
title: Nix
x-i18n:
    generated_at: "2026-05-06T17:57:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b4c2eca298ac7ae60baea4d06855edb73c0b8bfe253a3f478d93e934b31253b
    source_path: install/nix.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Installieren Sie OpenClaw deklarativ mit **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** - dem offiziellen, vollständig ausgestatteten Home Manager-Modul.

<Info>
Das [nix-openclaw](https://github.com/openclaw/nix-openclaw)-Repo ist die maßgebliche Quelle für die Nix-Installation. Diese Seite ist ein kurzer Überblick.
</Info>

## Was Sie erhalten

- Gateway + macOS-App + Tools (whisper, spotify, cameras) -- alles fest gepinnt
- launchd-Dienst, der Neustarts übersteht
- Plugin-System mit deklarativer Konfiguration
- Sofortiges Rollback: `home-manager switch --rollback`

## Schnellstart

<Steps>
  <Step title="Determinate Nix installieren">
    Wenn Nix noch nicht installiert ist, folgen Sie den Anweisungen des [Determinate Nix-Installers](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Lokalen Flake erstellen">
    Verwenden Sie die agent-first-Vorlage aus dem nix-openclaw-Repo:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Secrets konfigurieren">
    Richten Sie Ihr Messaging-Bot-Token und den API-Schlüssel Ihres Modell-Providers ein. Einfache Dateien unter `~/.secrets/` funktionieren gut.
  </Step>
  <Step title="Vorlagen-Platzhalter ausfüllen und wechseln">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Überprüfen">
    Bestätigen Sie, dass der launchd-Dienst läuft und Ihr Bot auf Nachrichten antwortet.
  </Step>
</Steps>

Vollständige Moduloptionen und Beispiele finden Sie in der [nix-openclaw README](https://github.com/openclaw/nix-openclaw).

## Laufzeitverhalten im Nix-Modus

Wenn `OPENCLAW_NIX_MODE=1` gesetzt ist (automatisch mit nix-openclaw), wechselt OpenClaw für Nix-verwaltete Installationen in einen deterministischen Modus. Andere Nix-Pakete können denselben Modus setzen; nix-openclaw ist die offizielle Referenz.

Sie können ihn auch manuell setzen:

```bash
export OPENCLAW_NIX_MODE=1
```

Unter macOS erbt die GUI-App Shell-Umgebungsvariablen nicht automatisch. Aktivieren Sie den Nix-Modus stattdessen über defaults:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Was sich im Nix-Modus ändert

- Abläufe für automatische Installation und Selbständerung sind deaktiviert
- `openclaw.json` wird als unveränderlich behandelt. Beim Start abgeleitete Standardwerte bleiben nur zur Laufzeit gültig, und Konfigurationsschreiber wie setup, onboarding, verändernde `openclaw update`-Aufrufe, Plugin install/update/uninstall/enable, `doctor --fix`, `doctor --generate-gateway-token` und `openclaw config set` verweigern das Bearbeiten der Datei.
- Agenten sollten stattdessen die Nix-Quelle bearbeiten. Für nix-openclaw verwenden Sie den agent-first-[Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start) und setzen die Konfiguration unter `programs.openclaw.config` oder `instances.<name>.config`.
- Fehlende Abhängigkeiten zeigen Nix-spezifische Hinweise zur Behebung an
- Die UI zeigt ein schreibgeschütztes Banner für den Nix-Modus an

### Konfigurations- und Statuspfade

OpenClaw liest die JSON5-Konfiguration aus `OPENCLAW_CONFIG_PATH` und speichert veränderliche Daten in `OPENCLAW_STATE_DIR`. Wenn Sie unter Nix arbeiten, setzen Sie diese Werte explizit auf Nix-verwaltete Speicherorte, damit Laufzeitstatus und Konfiguration außerhalb des unveränderlichen Stores bleiben.

| Variable               | Standard                                |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### Erkennung des Dienst-PATH

Der launchd/systemd-Gateway-Dienst erkennt Nix-Profil-Binärdateien automatisch, sodass
Plugins und Tools, die per Shell auf mit `nix` installierte ausführbare Dateien zugreifen, ohne
manuelle PATH-Einrichtung funktionieren:

- Wenn `NIX_PROFILES` gesetzt ist, wird jeder Eintrag dem Dienst-PATH mit
  Priorität von rechts nach links hinzugefügt (entspricht der Nix-Shell-Priorität - der rechteste Eintrag gewinnt).
- Wenn `NIX_PROFILES` nicht gesetzt ist, wird `~/.nix-profile/bin` als Fallback hinzugefügt.

Dies gilt sowohl für macOS-launchd- als auch für Linux-systemd-Dienstumgebungen.

## Verwandt

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    Maßgebliches Home Manager-Modul und vollständige Einrichtungsanleitung.
  </Card>
  <Card title="Einrichtungsassistent" href="/de/start/wizard" icon="wand-magic-sparkles">
    Nicht-Nix-CLI-Einrichtungsanleitung.
  </Card>
  <Card title="Docker" href="/de/install/docker" icon="docker">
    Containerisierte Einrichtung als Nicht-Nix-Alternative.
  </Card>
  <Card title="Aktualisieren" href="/de/install/updating" icon="arrow-up-right-from-square">
    Aktualisieren von Home Manager-verwalteten Installationen zusammen mit dem Paket.
  </Card>
</CardGroup>
