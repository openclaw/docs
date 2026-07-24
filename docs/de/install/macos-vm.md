---
read_when:
    - Sie möchten OpenClaw von Ihrer primären macOS-Umgebung isolieren.
    - Sie möchten die iMessage-Integration in einer Sandbox nutzen
    - Sie benötigen eine zurücksetzbare macOS-Umgebung, die Sie klonen können
    - Sie möchten lokale und gehostete Optionen für virtuelle macOS-Maschinen vergleichen
summary: Führen Sie OpenClaw in einer isolierten macOS-VM (lokal oder gehostet) aus, wenn Sie Isolation oder iMessage benötigen.
title: macOS-VMs
x-i18n:
    generated_at: "2026-07-24T03:56:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7e6b963faaf40f65adce1081715bc295059b8bed278a8c71a05a86e04ad7a7a5
    source_path: install/macos-vm.md
    workflow: 16
---

## Empfohlene Standardeinstellung (für die meisten Benutzer)

- **Kleiner Linux-VPS** für einen dauerhaft aktiven Gateway bei niedrigen Kosten. Siehe [VPS-Hosting](/de/vps).
- **Dedizierte Hardware** (Mac mini oder Linux-Rechner), wenn Sie vollständige Kontrolle und eine **private IP-Adresse** für Browserautomatisierung wünschen. Viele Websites blockieren IP-Adressen von Rechenzentren, daher funktioniert lokales Browsen oft besser.
- **Hybrid**: Betreiben Sie den Gateway auf einem günstigen VPS und verbinden Sie Ihren Mac als **Node**, wenn Sie Browser-/UI-Automatisierung benötigen. Siehe [Nodes](/de/nodes) und [Gateway-Remotezugriff](/de/gateway/remote).

Verwenden Sie eine macOS-VM nur, wenn Sie ausdrücklich Funktionen benötigen, die ausschließlich unter macOS verfügbar sind, beispielsweise iMessage, oder wenn Sie eine strikte Isolation von Ihrem täglich genutzten Mac wünschen.

## Optionen für macOS-VMs

### Lokale VM auf Ihrem Apple-Silicon-Mac (Lume)

Führen Sie OpenClaw mit [Lume](https://cua.ai/docs/lume) in einer isolierten macOS-VM auf Ihrem vorhandenen Apple-Silicon-Mac aus. Dies bietet Ihnen:

- Vollständige macOS-Umgebung in Isolation (Ihr Hostsystem bleibt unverändert)
- iMessage-Unterstützung über `imsg`; der standardmäßige lokale Pfad ist unter Linux/Windows nicht möglich
- Sofortiges Zurücksetzen durch Klonen von VMs
- Keine zusätzliche Hardware und keine Cloud-Kosten

### Gehostete Mac-Provider (Cloud)

Wenn Sie macOS in der Cloud verwenden möchten, funktionieren auch gehostete Mac-Provider:

- [MacStadium](https://www.macstadium.com/) (gehostete Macs)
- Andere Anbieter gehosteter Macs funktionieren ebenfalls; folgen Sie deren Dokumentation zu VMs und SSH

Sobald Sie SSH-Zugriff auf eine macOS-VM haben, fahren Sie unten mit [OpenClaw installieren](#6-install-openclaw) fort.

## Schnellverfahren (Lume, erfahrene Benutzer)

1. Installieren Sie Lume.
2. `lume create openclaw --os macos --ipsw latest`
3. Schließen Sie den Setup Assistant ab und aktivieren Sie Remote Login (SSH).
4. `lume run openclaw --no-display`
5. Stellen Sie eine SSH-Verbindung her, installieren Sie OpenClaw und konfigurieren Sie Kanäle.
6. Fertig.

## Voraussetzungen (Lume)

- Apple-Silicon-Mac (M1/M2/M3/M4)
- macOS Sequoia oder neuer auf dem Hostsystem
- ~60 GB freier Speicherplatz pro VM
- ~20 Minuten

## 1) Lume installieren

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Falls sich `~/.local/bin` nicht in Ihrem PATH befindet:

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
Der Download kann je nach Verbindung einige Zeit dauern.
</Note>

## 3) Setup Assistant abschließen

Im VNC-Fenster:

1. Wählen Sie Sprache und Region aus.
2. Überspringen Sie die Apple ID (oder melden Sie sich an, wenn Sie später iMessage verwenden möchten).
3. Erstellen Sie ein Benutzerkonto (merken Sie sich Benutzername und Passwort).
4. Überspringen Sie alle optionalen Funktionen.

Nach Abschluss der Einrichtung:

1. Aktivieren Sie SSH: System Settings -> General -> Sharing, aktivieren Sie "Remote Login".
2. Aktivieren Sie für die Nutzung der VM ohne Anzeige die automatische Anmeldung: System Settings -> Users & Groups, wählen Sie "Automatically log in as:" und anschließend den VM-Benutzer aus.

## 4) IP-Adresse der VM ermitteln

```bash
lume get openclaw
```

Suchen Sie nach der IP-Adresse (üblicherweise `192.168.64.x`).

## 5) Über SSH mit der VM verbinden

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

Folgen Sie den Onboarding-Aufforderungen, um Ihren Modell-Provider (Anthropic, OpenAI usw.) einzurichten.

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

## 8) VM ohne Anzeige ausführen

Stoppen Sie die VM und starten Sie sie ohne Anzeige neu:

```bash
lume stop openclaw
lume run openclaw --no-display
```

Die VM wird im Hintergrund ausgeführt; der Daemon von OpenClaw hält den Gateway aktiv. So prüfen Sie den Status:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

## Bonus: iMessage-Integration

Dies ist der größte Vorteil der Ausführung unter macOS. Verwenden Sie [iMessage](/de/channels/imessage) mit `imsg`, um Messages zu OpenClaw hinzuzufügen.

Innerhalb der VM:

1. Melden Sie sich bei Messages an.
2. Installieren Sie `imsg`.
3. Erteilen Sie dem Prozess, der OpenClaw/`imsg` ausführt, die Berechtigungen Full Disk Access und Automation.
4. Überprüfen Sie die RPC-Unterstützung mit `imsg rpc --help`.

Fügen Sie Folgendes zu Ihrer OpenClaw-Konfiguration hinzu:

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

Erstellen Sie einen Snapshot Ihres unveränderten Zustands, bevor Sie weitere Anpassungen vornehmen:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Sie können jederzeit zurücksetzen:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

## 24/7 ausführen

So halten Sie die VM in Betrieb:

- Lassen Sie Ihren Mac an die Stromversorgung angeschlossen
- Deaktivieren Sie den Ruhezustand unter System Settings -> Energy Saver
- Verwenden Sie bei Bedarf `caffeinate`

Für einen echten Dauerbetrieb sollten Sie einen dedizierten Mac mini oder einen kleinen VPS in Betracht ziehen. Siehe [VPS-Hosting](/de/vps).

## Fehlerbehebung

| Problem                         | Lösung                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Keine SSH-Verbindung zur VM möglich | Prüfen Sie, ob "Remote Login" in den System Settings der VM aktiviert ist                           |
| VM-IP wird nicht angezeigt      | Warten Sie, bis die VM vollständig gestartet ist, und führen Sie `lume get openclaw` erneut aus          |
| Lume-Befehl nicht gefunden      | Fügen Sie `~/.local/bin` Ihrem PATH hinzu                                                           |
| WhatsApp-QR-Code wird nicht gescannt | Stellen Sie sicher, dass Sie bei der Ausführung von `openclaw channels login` bei der VM (nicht beim Hostsystem) angemeldet sind |

## Verwandte Dokumentation

- [VPS-Hosting](/de/vps)
- [Nodes](/de/nodes)
- [Gateway-Remotezugriff](/de/gateway/remote)
- [iMessage-Kanal](/de/channels/imessage)
- [Lume-Schnellstart](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume-CLI-Referenz](https://cua.ai/docs/lume/reference/cli-reference)
- [Unbeaufsichtigte VM-Einrichtung](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (für Fortgeschrittene)
- [Docker-Sandboxing](/de/install/docker) (alternativer Isolationsansatz)
