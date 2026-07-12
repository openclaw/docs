---
read_when:
    - Sie möchten OpenClaw von Ihrer primären macOS-Umgebung isolieren.
    - Sie möchten iMessage in einer Sandbox integrieren
    - Sie möchten eine zurücksetzbare macOS-Umgebung, die Sie klonen können
    - Sie möchten lokale und gehostete Optionen für macOS-VMs vergleichen
summary: Führen Sie OpenClaw in einer isolierten macOS-VM (lokal oder gehostet) aus, wenn Sie eine Isolierung oder iMessage benötigen.
title: macOS-VMs
x-i18n:
    generated_at: "2026-07-12T01:48:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e6b963faaf40f65adce1081715bc295059b8bed278a8c71a05a86e04ad7a7a5
    source_path: install/macos-vm.md
    workflow: 16
---

## Empfohlene Standardeinstellung (für die meisten Benutzer)

- **Kleiner Linux-VPS** für einen ständig aktiven Gateway zu geringen Kosten. Siehe [VPS-Hosting](/de/vps).
- **Dedizierte Hardware** (Mac mini oder Linux-Rechner), wenn Sie vollständige Kontrolle und eine **private IP-Adresse** für die Browserautomatisierung benötigen. Viele Websites blockieren IP-Adressen von Rechenzentren, daher funktioniert lokales Browsen häufig besser.
- **Hybrid**: Belassen Sie den Gateway auf einem günstigen VPS und verbinden Sie Ihren Mac als **Node**, wenn Sie Browser-/UI-Automatisierung benötigen. Siehe [Nodes](/de/nodes) und [Gateway-Fernzugriff](/de/gateway/remote).

Verwenden Sie eine macOS-VM nur, wenn Sie ausdrücklich Funktionen benötigen, die ausschließlich unter macOS verfügbar sind, beispielsweise iMessage, oder wenn Sie eine strikte Isolierung von Ihrem täglich genutzten Mac wünschen.

## Optionen für macOS-VMs

### Lokale VM auf Ihrem Apple-Silicon-Mac (Lume)

Führen Sie OpenClaw mithilfe von [Lume](https://cua.ai/docs/lume) in einer isolierten macOS-VM auf Ihrem vorhandenen Apple-Silicon-Mac aus. Dies bietet Ihnen:

- Vollständige macOS-Umgebung in Isolation (Ihr Host bleibt unverändert)
- iMessage-Unterstützung über `imsg`; der lokale Standardpfad ist unter Linux/Windows nicht möglich
- Sofortiges Zurücksetzen durch Klonen von VMs
- Keine zusätzliche Hardware und keine Cloud-Kosten

### Gehostete Mac-Provider (Cloud)

Wenn Sie macOS in der Cloud verwenden möchten, eignen sich auch gehostete Mac-Provider:

- [MacStadium](https://www.macstadium.com/) (gehostete Macs)
- Andere Anbieter für gehostete Macs funktionieren ebenfalls; befolgen Sie deren Dokumentation zu VMs und SSH

Sobald Sie SSH-Zugriff auf eine macOS-VM haben, fahren Sie unten mit [OpenClaw installieren](#6-install-openclaw) fort.

## Schnellverfahren (Lume, erfahrene Benutzer)

1. Installieren Sie Lume.
2. `lume create openclaw --os macos --ipsw latest`
3. Schließen Sie den Setup-Assistenten ab und aktivieren Sie Remote Login (SSH).
4. `lume run openclaw --no-display`
5. Stellen Sie eine SSH-Verbindung her, installieren Sie OpenClaw und konfigurieren Sie Kanäle.
6. Fertig.

## Voraussetzungen (Lume)

- Apple-Silicon-Mac (M1/M2/M3/M4)
- macOS Sequoia oder neuer auf dem Host
- Etwa 60 GB freier Speicherplatz pro VM
- Etwa 20 Minuten

## 1) Lume installieren

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Falls `~/.local/bin` nicht in Ihrem PATH enthalten ist:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Überprüfen Sie die Installation:

```bash
lume --version
```

Dokumentation: [Lume-Installation](https://cua.ai/docs/lume/guide/getting-started/installation)

## 2) macOS-VM erstellen

```bash
lume create openclaw --os macos --ipsw latest
```

Dadurch wird macOS heruntergeladen und die VM erstellt. Ein VNC-Fenster wird automatisch geöffnet.

<Note>
Der Download kann abhängig von Ihrer Verbindung einige Zeit dauern.
</Note>

## 3) Setup-Assistenten abschließen

Im VNC-Fenster:

1. Wählen Sie Sprache und Region aus.
2. Überspringen Sie die Apple ID (oder melden Sie sich an, wenn Sie später iMessage verwenden möchten).
3. Erstellen Sie ein Benutzerkonto (merken Sie sich Benutzername und Passwort).
4. Überspringen Sie alle optionalen Funktionen.

Nach Abschluss der Einrichtung:

1. Aktivieren Sie SSH: System Settings -> General -> Sharing, und aktivieren Sie "Remote Login".
2. Aktivieren Sie für die Nutzung der VM ohne grafische Oberfläche die automatische Anmeldung: System Settings -> Users & Groups, wählen Sie "Automatically log in as:" und anschließend den VM-Benutzer aus.

## 4) IP-Adresse der VM abrufen

```bash
lume get openclaw
```

Suchen Sie nach der IP-Adresse (normalerweise `192.168.64.x`).

## 5) SSH-Verbindung zur VM herstellen

```bash
ssh youruser@192.168.64.X
```

Ersetzen Sie `youruser` durch das von Ihnen erstellte Konto und die IP-Adresse durch die IP-Adresse Ihrer VM.

## 6) OpenClaw installieren

Innerhalb der VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Folgen Sie den Anweisungen des Einrichtungsassistenten, um Ihren Modell-Provider (Anthropic, OpenAI usw.) einzurichten.

## 7) Kanäle konfigurieren

Bearbeiten Sie die Konfigurationsdatei:

```bash
nano ~/.openclaw/openclaw.json
```

Fügen Sie Ihre Kanäle hinzu:

```json5
{
  channels: {
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
  },
}
```

Melden Sie sich anschließend bei WhatsApp an (QR-Code scannen):

```bash
openclaw channels login
```

## 8) VM ohne grafische Oberfläche ausführen

Stoppen Sie die VM und starten Sie sie ohne Anzeige neu:

```bash
lume stop openclaw
lume run openclaw --no-display
```

Die VM wird im Hintergrund ausgeführt; der Daemon von OpenClaw hält den Gateway aktiv. So überprüfen Sie den Status:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

## Bonus: iMessage-Integration

Dies ist der entscheidende Vorteil der Ausführung unter macOS. Verwenden Sie [iMessage](/de/channels/imessage) mit `imsg`, um Nachrichten zu OpenClaw hinzuzufügen.

Innerhalb der VM:

1. Melden Sie sich bei Nachrichten an.
2. Installieren Sie `imsg`.
3. Erteilen Sie dem Prozess, der OpenClaw/`imsg` ausführt, Festplattenvollzugriff und die Berechtigung zur Automatisierung.
4. Überprüfen Sie die RPC-Unterstützung mit `imsg rpc --help`.

Fügen Sie Ihrer OpenClaw-Konfiguration Folgendes hinzu:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
    },
  },
}
```

Starten Sie den Gateway neu. Ihr Agent kann nun iMessages senden und empfangen. Vollständige Einrichtungsdetails: [iMessage-Kanal](/de/channels/imessage).

## Golden Image speichern

Erstellen Sie vor weiteren Anpassungen einen Snapshot Ihres unveränderten Zustands:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Sie können die VM jederzeit zurücksetzen:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

## Betrieb rund um die Uhr

Halten Sie die VM dauerhaft in Betrieb, indem Sie:

- Ihren Mac am Stromnetz angeschlossen lassen
- Den Ruhezustand unter System Settings -> Energy Saver deaktivieren
- Bei Bedarf `caffeinate` verwenden

Für einen echten Dauerbetrieb sollten Sie einen dedizierten Mac mini oder einen kleinen VPS in Betracht ziehen. Siehe [VPS-Hosting](/de/vps).

## Fehlerbehebung

| Problem                             | Lösung                                                                                                            |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Keine SSH-Verbindung zur VM möglich | Prüfen Sie, ob "Remote Login" in den System Settings der VM aktiviert ist                                         |
| VM-IP wird nicht angezeigt          | Warten Sie, bis die VM vollständig gestartet ist, und führen Sie `lume get openclaw` erneut aus                   |
| Lume-Befehl nicht gefunden          | Fügen Sie `~/.local/bin` Ihrem PATH hinzu                                                                          |
| WhatsApp-QR-Code wird nicht gescannt | Stellen Sie sicher, dass Sie bei der Ausführung von `openclaw channels login` in der VM und nicht beim Host angemeldet sind |

## Verwandte Dokumentation

- [VPS-Hosting](/de/vps)
- [Nodes](/de/nodes)
- [Gateway-Fernzugriff](/de/gateway/remote)
- [iMessage-Kanal](/de/channels/imessage)
- [Lume-Schnellstart](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume-CLI-Referenz](https://cua.ai/docs/lume/reference/cli-reference)
- [Unbeaufsichtigte VM-Einrichtung](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (fortgeschritten)
- [Docker-Sandboxing](/de/install/docker) (alternativer Isolierungsansatz)
