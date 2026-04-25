---
read_when:
    - Sie möchten reproduzierbare Installationen mit Rollback-Möglichkeit
    - Sie verwenden bereits Nix/NixOS/Home Manager
    - Sie möchten, dass alles fixiert und deklarativ verwaltet wird
summary: OpenClaw deklarativ mit Nix installieren
title: Nix
x-i18n:
    generated_at: "2026-04-25T13:49:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7980e48d9fac49396d9dd06cf8516d572c97def1764db94cf66879d81d63694c
    source_path: install/nix.md
    workflow: 15
---

OpenClaw deklarativ mit **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** installieren — einem Home-Manager-Modul mit allem Nötigen.

<Info>
Das Repository [nix-openclaw](https://github.com/openclaw/nix-openclaw) ist die maßgebliche Quelle für die Installation mit Nix. Diese Seite ist ein kurzer Überblick.
</Info>

## Was Sie erhalten

- Gateway + macOS-App + Tools (whisper, spotify, cameras) -- alles fixiert
- Launchd-Dienst, der Neustarts übersteht
- Plugin-System mit deklarativer Konfiguration
- Sofortiges Rollback: `home-manager switch --rollback`

## Schnellstart

<Steps>
  <Step title="Determinate Nix installieren">
    Wenn Nix noch nicht installiert ist, folgen Sie den Anweisungen des [Determinate Nix installers](https://github.com/DeterminateSystems/nix-installer).
  </Step>
  <Step title="Ein lokales Flake erstellen">
    Verwenden Sie das agentenorientierte Template aus dem Repository nix-openclaw:
    ```bash
    mkdir -p ~/code/openclaw-local
    # Kopieren Sie templates/agent-first/flake.nix aus dem Repository nix-openclaw
    ```
  </Step>
  <Step title="Geheimnisse konfigurieren">
    Richten Sie Ihr Messaging-Bot-Token und den API-Key Ihres Modell-Providers ein. Einfache Dateien unter `~/.secrets/` funktionieren gut.
  </Step>
  <Step title="Template-Platzhalter ausfüllen und wechseln">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Verifizieren">
    Bestätigen Sie, dass der launchd-Dienst läuft und Ihr Bot auf Nachrichten antwortet.
  </Step>
</Steps>

Siehe die [nix-openclaw README](https://github.com/openclaw/nix-openclaw) für vollständige Moduloptionen und Beispiele.

## Laufzeitverhalten im Nix-Modus

Wenn `OPENCLAW_NIX_MODE=1` gesetzt ist (automatisch mit nix-openclaw), wechselt OpenClaw in einen deterministischen Modus, der automatische Installationsabläufe deaktiviert.

Sie können es auch manuell setzen:

```bash
export OPENCLAW_NIX_MODE=1
```

Unter macOS übernimmt die GUI-App Shell-Umgebungsvariablen nicht automatisch. Aktivieren Sie den Nix-Modus stattdessen über defaults:

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Was sich im Nix-Modus ändert

- Auto-Install- und Self-Mutation-Abläufe sind deaktiviert
- Fehlende Abhängigkeiten zeigen Nix-spezifische Hinweise zur Behebung an
- Die UI zeigt ein schreibgeschütztes Nix-Modus-Banner an

### Konfigurations- und Statuspfade

OpenClaw liest die JSON5-Konfiguration aus `OPENCLAW_CONFIG_PATH` und speichert veränderliche Daten in `OPENCLAW_STATE_DIR`. Wenn OpenClaw unter Nix läuft, setzen Sie diese explizit auf von Nix verwaltete Speicherorte, damit Laufzeitstatus und Konfiguration außerhalb des unveränderlichen Stores bleiben.

| Variable               | Standard                                |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### PATH-Erkennung für Dienste

Der launchd-/systemd-Gateway-Dienst erkennt Binärdateien aus Nix-Profilen automatisch, sodass
Plugins und Tools, die per Shell auf mit `nix` installierte ausführbare Dateien zugreifen,
ohne manuelle PATH-Konfiguration funktionieren:

- Wenn `NIX_PROFILES` gesetzt ist, wird jeder Eintrag dem Dienst-PATH mit
  Priorität von rechts nach links hinzugefügt (entspricht der Priorität von Nix-Shells — ganz rechts gewinnt).
- Wenn `NIX_PROFILES` nicht gesetzt ist, wird `~/.nix-profile/bin` als Fallback hinzugefügt.

Dies gilt sowohl für launchd-Dienstumgebungen unter macOS als auch für systemd-Dienstumgebungen unter Linux.

## Verwandt

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) -- vollständige Einrichtungsanleitung
- [Wizard](/de/start/wizard) -- CLI-Setup ohne Nix
- [Docker](/de/install/docker) -- containerisiertes Setup
