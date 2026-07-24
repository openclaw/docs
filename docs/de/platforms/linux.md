---
read_when:
    - Status der Linux-Begleit-App wird gesucht
    - Kamera, Standort oder Benachrichtigungen auf einem Linux-Node-Host aktivieren
    - Plattformabdeckung oder Beiträge planen
    - Debugging von Linux-OOM-Kills oder Exit 137 auf einem VPS oder in einem Container
summary: Linux-Unterstützung + Status der Begleit-App
title: Linux-App
x-i18n:
    generated_at: "2026-07-24T03:59:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fe55d3ec63fcf8291a24126c04638f005c03c3d44ff84a26a925e931066b01cc
    source_path: platforms/linux.md
    workflow: 16
---

Das Gateway wird unter Linux vollständig unterstützt und erfordert Node. Bun kann weiterhin
als Abhängigkeits-Installer oder Runner für Paketskripte verwendet werden, kann OpenClaw
jedoch nicht ausführen, da es `node:sqlite` nicht bereitstellt.

## Desktop-Begleit-App

Die OpenClaw-Begleit-App für Linux ist eine Tauri-Desktop-App für ein lokales Gateway. Sie:

- installiert die OpenClaw CLI und die verwaltete Node-Laufzeit, wenn diese fehlen; Release-Builds installieren automatisch den stabilen Kanal, während Entwicklungs-Builds zunächst nach dem Kanal fragen
- verbindet sich mit einem fehlerfrei funktionierenden Gateway, bevor sie Dienständerungen versucht
- delegiert Installations-, Start-, Stopp- und Neustartvorgänge an den von der CLI verwalteten systemd-Benutzerdienst
- erkennt Gateways in der Nähe über Bonjour und öffnet jede Control UI in einem routenspezifischen Fenster, sodass mehrere
  Gateway-Dashboards verbunden bleiben und gleichzeitig verwendet werden können
- öffnet die vom Gateway bereitgestellte Control UI mit ihrer aufgelösten Authentifizierungs-URL
- öffnet die Control UI nach der erstmaligen Installation im Onboarding-Modus, der
  anbietet, erkannte Erinnerungen aus Claude Code, Codex oder Hermes in den
  Agent-Arbeitsbereich zu importieren (derselbe Import bleibt später unter
  Settings → Import Memory verfügbar)
- rendert agentengesteuerte Canvas- und gebündelte A2UI-Inhalte für einen am selben Ort ausgeführten CLI-Node-Host
- bleibt über den Infobereich verfügbar, wenn ihr Fenster geschlossen wird

Stabile Releases, die aus `main` erstellt wurden, stellen `.deb`- und AppImage-Pakete als Assets im
[GitHub-Release](https://github.com/openclaw/openclaw/releases) für das Tag bereit,
die `OpenClaw-<version>-amd64.deb` und `OpenClaw-<version>-amd64.AppImage`
heißen und neben denen sich eine `SHA256SUMS.linux-app.txt`-Prüfsummendatei befindet. Laden Sie
`.deb` herunter und installieren Sie es mit `sudo apt install ./OpenClaw-<version>-amd64.deb`,
oder markieren Sie das AppImage als ausführbar und führen Sie es direkt aus. Die AppImage-Laufzeit
benötigt FUSE 2 (`sudo apt install libfuse2` oder `libfuse2t64` unter Ubuntu 24.04+);
führen Sie das AppImage andernfalls mit `APPIMAGE_EXTRACT_AND_RUN=1` aus.

Sie können dieselben Pakete auch aus einem Source-Checkout erstellen:

```bash
cd apps/linux/src-tauri
pnpm dlx @tauri-apps/cli@2.11.4 build --bundles deb,appimage
```

Der CI-Workflow `Linux App` lädt dieselben Pakete als
Artefakt `openclaw-linux-companion` für Pull Requests hoch, die die App betreffen, sowie für
manuelle Ausführungen. Informationen zu Linux-Build-Abhängigkeiten
und Entwicklungsbefehlen finden Sie im Repository unter `apps/linux/README.md`.

### Quick Chat

Öffnen Sie Quick Chat mit `Ctrl+Shift+Space` oder über den Eintrag **Quick Chat** im Infobereich. Der Agent-Chip
zeigt den konfigurierten Avatar, das Emoji oder das Monogramm an; wählen Sie ihn aus, um den Agenten zu wechseln.
Nachrichten verwenden die Hauptsitzung des ausgewählten Agenten und berücksichtigen den globalen Sitzungsbereich.
Der native Rust-Client verwaltet eine persistente Ed25519-Geräteidentität. Er verwendet das
gemeinsame Token oder Passwort aus der CLI-Übergabe nur zur Initialisierung der Kopplung, speichert anschließend
das vom Gateway ausgegebene Geräte-Token und bevorzugt es bei späteren Verbindungen. Die Identität und
das Geräte-Token befinden sich im App-Konfigurationsverzeichnis in einer Datei mit dem Modus `0600`; die WebView von Quick
Chat erhält weder Anmeldedaten noch den WebSocket.

Wenn die native Verbindung nicht verfügbar ist, zeigt Quick Chat **Gateway
unreachable — retrying** an und deaktiviert das Senden bis zur Wiederherstellung der Verbindung. Bei einem Remote-Gerät,
das die Kopplungsphase erreicht hat, wird stattdessen **Approve this device in the dashboard
(Nodes)** angezeigt, zusammen mit einer kurzen Geräte-ID, sofern das Gateway eine bereitstellt. Bei einem
Gateway, für das gemeinsame Anmeldedaten fehlen, wird **Gateway requires a
credential — open the dashboard on the gateway host** angezeigt; in diesem Zustand wartet keine Kopplungsanfrage
auf Genehmigung. Vom Server bereitgestellte Hinweise zur Problembehebung
ersetzen diese Ausweichmeldungen, wenn sie spezifischer sind.
Für TLS-Gateways übergibt die CLI der App den SHA-256-Fingerabdruck
des Gateway-Zertifikats; der native Client pinnt dieses Zertifikat und meldet **Gateway TLS
trust failed — check the certificate fingerprint** getrennt von einer Nichtverfügbarkeit.
Gateways, deren gemeinsames Geheimnis über eine SecretRef konfiguriert ist, lassen es in der
CLI-Übergabe aus. Bestehende gekoppelte Installationen funktionieren weiterhin mit ihrem gespeicherten Geräte-Token,
eine Neuinstallation kann jedoch unter Authentifizierung mit gemeinsamem Geheimnis keine ausstehende Kopplungsanfrage
ohne diese initialen Anmeldedaten erstellen.
Die Einlösung von Einrichtungscodes und `bootstrapToken` erfordert eine eigene Produktoberfläche und bleibt
eine Folgeaufgabe; Quick Chat versucht keinen der beiden Abläufe.

Unter X11 können Sie über das Zahnrad in Quick Chat eine benutzerdefinierte Tastenkombination aufzeichnen oder zurücksetzen. Der
Schalter **Quick Chat shortcut** im Infobereich aktiviert oder deaktiviert sie, ohne den
normalen Eintrag **Quick Chat** im Infobereich zu deaktivieren. Globale Tastenkombinationen sind unter Wayland nicht verfügbar, daher
werden die Einstellungen für Tastenkombinationen ausgeblendet und der Eintrag im Infobereich bleibt der Einstiegspunkt.
Nach erfolgreichem Senden bleibt Quick Chat geöffnet und streamt die
Nur-Text-Antwort des ausgewählten Agenten unterhalb des Eingabefelds. Drücken Sie `Esc`, um die Leiste und ihre Antwort zu schließen;
`Ctrl+Enter` öffnet weiterhin das Dashboard.

### Canvas

Linux Canvas verwendet zwei zusammenarbeitende Prozesse. `openclaw node run` bleibt die einzige Gateway-Node-Verbindung; das gebündelte Plugin `linux-canvas` leitet `canvas.*`-Aufrufe über einen Unix-Socket, auf den nur der Benutzer zugreifen kann, an die ausgeführte Desktop-App weiter. Die App verwaltet ein bei Bedarf geöffnetes WebView-Fenster, einschließlich des gebündelten A2UI-Renderers und der Aktionsbrücke zurück zum Agenten.

Das Plugin ist standardmäßig aktiviert. Es kündigt Canvas nur an, wenn der Desktop-Socket unter `$XDG_RUNTIME_DIR/openclaw-canvas.sock` vorhanden ist, beziehungsweise unter `/tmp/openclaw-canvas-$UID.sock`, wenn `XDG_RUNTIME_DIR` nicht verfügbar ist. Deaktivieren Sie es mit `plugins.entries.linux-canvas.enabled: false`. Auf einem Headless-Linux-Server ohne Desktop-App wird Canvas nicht angekündigt.

Linux v1 verwendet ein Canvas-Fenster. HTTP- und HTTPS-Seiten können gerendert werden, A2UI-Aktionen werden jedoch nur vom gebündelten Renderer akzeptiert.

## Alternative mit CLI und SSH

Die CLI bleibt die einfachste Option für einen Headless-Server, einen VPS oder ein Remote-Gateway:

1. Installieren Sie Node 24.15+ (empfohlen), Node 22.22.3+ (LTS) oder Node 25.9+.
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Von Ihrem Laptop aus: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Öffnen Sie `http://127.0.0.1:18789/` und authentifizieren Sie sich mit dem konfigurierten gemeinsamen
   Geheimnis (standardmäßig Token; Passwort, wenn `gateway.auth.mode` den Wert `"password"` hat).

Vollständige Server-Anleitung: [Linux-Server](/de/vps). Schrittweises VPS-Beispiel:
[exe.dev](/de/install/exe-dev).

## Node-Funktionen

Das gebündelte Linux-Node-Plugin stellt der CLI Gerätefunktionen des Dienstes `openclaw node` bereit, ohne dass die Desktop-App erforderlich ist. Befehle werden dem Gateway nur angekündigt, wenn ihre Funktion aktiviert und das erforderliche lokale Tool vorhanden ist.

| Funktion                              | Standard | Anforderung                                                           |
| --------------------------------------- | ------- | --------------------------------------------------------------------- |
| Desktop-Benachrichtigungen (`system.notify`) | Ein      | `notify-send` aus libnotify und eine Desktop-Benachrichtigungssitzung       |
| Kamerafotos und -clips (`camera.*`)    | Aus     | FFmpeg, V4L2-Kamerazugriff und PulseAudio oder PipeWire für Clip-Audio |
| Standort (`location.get`)               | Aus     | GeoClue2 und dessen `where-am-i`-Demo                                    |

Konfigurieren Sie das Plugin in `openclaw.json`:

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          notify: { enabled: true },
          camera: { enabled: true },
          location: { enabled: true },
        },
      },
    },
  },
}
```

Starten Sie den Node-Dienst neu, nachdem Sie diese Einstellungen geändert haben. Die Verfügbarkeit wird einmal pro Prozess ermittelt, und die Node-Ankündigung wird beim Neustart neu erstellt.

Das Gateway genehmigt die Befehls- und Funktionsoberfläche der Node getrennt von der Gerätekopplung. Genehmigen Sie beim ersten Start oder nach der Aktivierung weiterer Funktionen die ausstehende Oberfläche:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

Eine Node kann verbunden und mit einem Gerät gekoppelt sein, während ihre effektiven `caps` und `commands` leer bleiben, bis diese Genehmigung abgeschlossen ist.

Kamerageräte müssen für den Dienstbenutzer lesbar sein, üblicherweise über die Gruppe `video`. Kameraclips verwenden die standardmäßige PulseAudio- oder PipeWire-Quelle, wenn `includeAudio` den Wert true hat; Mikrofonaudio ist nur als Audiospur dieses Clips vorhanden, nicht als eigenständiger Befehl. Für den Standort muss der Benutzer des Node-Dienstes durch die GeoClue-Richtlinie des Hosts berechtigt sein.

`camera.snap` und `camera.clip` erfordern außerdem eine ausdrückliche Aktivierung durch das Gateway über `gateway.nodes.commands.allow`. Informationen zu Payloads, Grenzwerten und Fehlern finden Sie unter [Kameraaufnahme](/de/nodes/camera) und [Standortbefehl](/de/nodes/location-command).

## Installation

- [Erste Schritte](/de/start/getting-started)
- [Installation und Aktualisierungen](/de/install/updating)
- Optional: [Bun-Paketworkflow](/de/install/bun), [Nix](/de/install/nix), [Docker](/de/install/docker)

## Gateway-Dienst (systemd)

Installieren Sie ihn mit einer der folgenden Optionen:

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # select "Gateway service" when prompted
```

Reparieren oder migrieren Sie eine vorhandene Installation:

```bash
openclaw doctor
```

`openclaw gateway install` erzeugt standardmäßig eine systemd-**Benutzereinheit**. Die vollständige
Anleitung zum Dienst, einschließlich der Variante auf **System**ebene für gemeinsam genutzte oder
dauerhaft aktive Hosts, finden Sie im [Gateway-Runbook](/de/gateway#supervision-and-service-lifecycle).

Erstellen Sie eine Einheit nur für eine benutzerdefinierte Einrichtung manuell. Minimales Beispiel einer Benutzereinheit
(`~/.config/systemd/user/openclaw-gateway[-<profile>].service`):

```ini
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

Manuell erstellte Einheiten übernehmen nicht die adaptive Heap-Größenanpassung, die `openclaw gateway install` für verwaltete Gateway-Dienste schreibt. Verwenden Sie vorzugsweise das verwaltete Installationsprogramm oder legen Sie im benutzerdefinierten Supervisor ein ausdrückliches Heap-Limit fest, nachdem Sie den Spielraum für nativen Speicher berücksichtigt haben.

Aktivieren Sie ihn:

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Speicherdruck und OOM-Beendigungen

Unter Linux wählt der Kernel ein OOM-Opfer aus, wenn einem Host, einer VM oder einer Container-cgroup
der Speicher ausgeht. Das Gateway ist ein ungeeignetes Opfer, da es langlebige
Sitzungen und Kanalverbindungen verwaltet. Daher sorgt OpenClaw nach Möglichkeit dafür, dass kurzlebige Kindprozesse
zuerst beendet werden.

Für geeignete Linux-Kindprozessstarts umschließt OpenClaw den Befehl mit einem kurzen
`/bin/sh`-Shim, der den eigenen Wert `oom_score_adj` des Kindprozesses auf `1000` erhöht und anschließend
den tatsächlichen Befehl mit `exec` ausführt. Dies erfordert keine erhöhten Berechtigungen: Ein Prozess darf seinen
eigenen OOM-Wert jederzeit erhöhen.

Abgedeckte Kindprozessoberflächen:

- Vom Supervisor verwaltete Befehlskindprozesse
- PTY-Shell-Kindprozesse
- Kindprozesse von MCP-stdio-Servern
- Von OpenClaw gestartete Browser-/Chrome-Prozesse (über die Prozesslaufzeit des Plugin SDK)

Der Wrapper ist ausschließlich für Linux vorgesehen und wird übersprungen, wenn `/bin/sh` nicht verfügbar ist oder wenn
die Umgebung des Kindprozesses `OPENCLAW_CHILD_OOM_SCORE_ADJ` auf `0`, `false`, `no` oder
`off` setzt.

Überprüfen Sie einen Kindprozess:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Der erwartete Wert für abgedeckte Kindprozesse ist `1000`; der Gateway-Prozess selbst
behält seinen normalen Wert bei (üblicherweise `0`).

Der Wert `OOMPolicy=continue` der systemd-Einheit hält den Gateway-Dienst aktiv, wenn
der OOM-Killer einen kurzlebigen Kindprozess auswählt, anstatt die gesamte
Einheit als fehlgeschlagen zu markieren und alle Kanäle neu zu starten; der fehlgeschlagene Kindprozess beziehungsweise die fehlgeschlagene Sitzung meldet
den eigenen Fehler.

Dies ersetzt keine normale Speicheroptimierung. Wenn ein VPS oder Container wiederholt
Kindprozesse beendet, erhöhen Sie das Speicherlimit, reduzieren Sie die Parallelität oder fügen Sie strengere
Ressourcensteuerungen hinzu (systemd `MemoryMax=`, Container-Speicherlimits).

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Linux-Server](/de/vps)
- [Raspberry Pi](/de/install/raspberry-pi)
- [Gateway-Betriebshandbuch](/de/gateway)
- [Gateway-Konfiguration](/de/gateway/configuration)
