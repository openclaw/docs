---
read_when:
    - Sie möchten OpenClaw von Ihrer primären macOS-Umgebung isolieren
    - Sie möchten die iMessage-Integration (BlueBubbles) in einer Sandbox nutzen
    - Sie möchten eine zurücksetzbare macOS-Umgebung, die Sie klonen können
    - Sie möchten lokale und gehostete macOS-VM-Optionen vergleichen
summary: Führen Sie OpenClaw in einer sandboxierten macOS-VM (lokal oder gehostet) aus, wenn Sie Isolation oder iMessage benötigen
title: macOS-VMs
x-i18n:
    generated_at: "2026-05-06T06:54:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2b6841f66e63606346f364bb1b1b9ca4a3d52558e3d8c6f129c5b89387c6968
    source_path: install/macos-vm.md
    workflow: 16
---

## Empfohlene Standardeinstellung (die meisten Nutzer)

- **Kleiner Linux-VPS** für ein dauerhaft laufendes Gateway und geringe Kosten. Siehe [VPS-Hosting](/de/vps).
- **Dedizierte Hardware** (Mac mini oder Linux-Rechner), wenn Sie volle Kontrolle und eine **private IP-Adresse** für Browserautomatisierung möchten. Viele Websites blockieren Rechenzentrums-IPs, daher funktioniert lokales Browsen oft besser.
- **Hybrid:** Betreiben Sie das Gateway auf einem günstigen VPS und verbinden Sie Ihren Mac als **Node**, wenn Sie Browser-/UI-Automatisierung benötigen. Siehe [Nodes](/de/nodes) und [Remote-Gateway](/de/gateway/remote).

Verwenden Sie eine macOS-VM, wenn Sie ausdrücklich macOS-spezifische Funktionen (iMessage/BlueBubbles) benötigen oder eine strikte Isolierung von Ihrem Alltags-Mac wünschen.

## macOS-VM-Optionen

### Lokale VM auf Ihrem Apple-Silicon-Mac (Lume)

Führen Sie OpenClaw in einer isolierten macOS-VM auf Ihrem vorhandenen Apple-Silicon-Mac mit [Lume](https://cua.ai/docs/lume) aus.

Das bietet Ihnen:

- Vollständige macOS-Umgebung in Isolation (Ihr Host bleibt sauber)
- iMessage-Unterstützung über BlueBubbles (unter Linux/Windows nicht möglich)
- Sofortiges Zurücksetzen durch Klonen von VMs
- Keine zusätzliche Hardware oder Cloud-Kosten

### Gehostete Mac-Provider (Cloud)

Wenn Sie macOS in der Cloud möchten, funktionieren gehostete Mac-Provider ebenfalls:

- [MacStadium](https://www.macstadium.com/) (gehostete Macs)
- Andere gehostete Mac-Anbieter funktionieren ebenfalls; folgen Sie deren VM- und SSH-Dokumentation

Sobald Sie SSH-Zugriff auf eine macOS-VM haben, fahren Sie unten mit Schritt 6 fort.

---

## Schneller Weg (Lume, erfahrene Nutzer)

1. Installieren Sie Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Schließen Sie den Setup-Assistenten ab, aktivieren Sie Remote Login (SSH)
4. `lume run openclaw --no-display`
5. Melden Sie sich per SSH an, installieren Sie OpenClaw, konfigurieren Sie Kanäle
6. Fertig

---

## Was Sie benötigen (Lume)

- Apple-Silicon-Mac (M1/M2/M3/M4)
- macOS Sequoia oder neuer auf dem Host
- ~60 GB freier Speicherplatz pro VM
- ~20 Minuten

---

## 1) Lume installieren

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Wenn `~/.local/bin` nicht in Ihrem PATH ist:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Überprüfen:

```bash
lume --version
```

Dokumentation: [Lume-Installation](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) macOS-VM erstellen

```bash
lume create openclaw --os macos --ipsw latest
```

Dies lädt macOS herunter und erstellt die VM. Ein VNC-Fenster öffnet sich automatisch.

<Note>
Der Download kann je nach Verbindung eine Weile dauern.
</Note>

---

## 3) Setup-Assistent abschließen

Im VNC-Fenster:

1. Sprache und Region auswählen
2. Apple ID überspringen (oder anmelden, wenn Sie später iMessage nutzen möchten)
3. Benutzerkonto erstellen (Benutzername und Passwort merken)
4. Alle optionalen Funktionen überspringen

Nach Abschluss der Einrichtung SSH aktivieren:

1. Systemeinstellungen → Allgemein → Teilen öffnen
2. „Remote Login“ aktivieren

---

## 4) IP-Adresse der VM abrufen

```bash
lume get openclaw
```

Suchen Sie nach der IP-Adresse (normalerweise `192.168.64.x`).

---

## 5) Per SSH mit der VM verbinden

```bash
ssh youruser@192.168.64.X
```

Ersetzen Sie `youruser` durch das Konto, das Sie erstellt haben, und die IP-Adresse durch die IP Ihrer VM.

---

## 6) OpenClaw installieren

Innerhalb der VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Folgen Sie den Onboarding-Eingabeaufforderungen, um Ihren Modell-Provider (Anthropic, OpenAI usw.) einzurichten.

---

## 7) Kanäle konfigurieren

Bearbeiten Sie die Konfigurationsdatei:

```bash
nano ~/.openclaw/openclaw.json
```

Fügen Sie Ihre Kanäle hinzu:

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
  },
}
```

Melden Sie sich anschließend bei WhatsApp an (QR scannen):

```bash
openclaw channels login
```

---

## 8) VM headless ausführen

Stoppen Sie die VM und starten Sie sie ohne Anzeige neu:

```bash
lume stop openclaw
lume run openclaw --no-display
```

Die VM läuft im Hintergrund. Der Daemon von OpenClaw hält das Gateway am Laufen.

Status prüfen:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Bonus: iMessage-Integration

Das ist die wichtigste Funktion beim Betrieb unter macOS. Verwenden Sie [BlueBubbles](https://bluebubbles.app), um iMessage zu OpenClaw hinzuzufügen.

Innerhalb der VM:

1. Laden Sie BlueBubbles von bluebubbles.app herunter
2. Melden Sie sich mit Ihrer Apple ID an
3. Aktivieren Sie die Web-API und legen Sie ein Passwort fest
4. Richten Sie BlueBubbles-Webhooks auf Ihr Gateway aus (Beispiel: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

Fügen Sie dies Ihrer OpenClaw-Konfiguration hinzu:

```json5
{
  channels: {
    bluebubbles: {
      serverUrl: "http://localhost:1234",
      password: "your-api-password",
      webhookPath: "/bluebubbles-webhook",
    },
  },
}
```

Starten Sie das Gateway neu. Ihr Agent kann jetzt iMessages senden und empfangen.

Vollständige Einrichtungsdetails: [BlueBubbles-Kanal](/de/channels/bluebubbles)

---

## Golden Image speichern

Bevor Sie weitere Anpassungen vornehmen, erstellen Sie einen Snapshot Ihres sauberen Zustands:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Jederzeit zurücksetzen:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## Betrieb rund um die Uhr

Halten Sie die VM am Laufen, indem Sie:

- Ihren Mac am Strom angeschlossen lassen
- den Ruhezustand in Systemeinstellungen → Energie sparen deaktivieren
- bei Bedarf `caffeinate` verwenden

Für echten Dauerbetrieb sollten Sie einen dedizierten Mac mini oder einen kleinen VPS in Betracht ziehen. Siehe [VPS-Hosting](/de/vps).

---

## Fehlerbehebung

| Problem                              | Lösung                                                                                                      |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| SSH-Verbindung zur VM nicht möglich  | Prüfen Sie, ob „Remote Login“ in den Systemeinstellungen der VM aktiviert ist                                |
| VM-IP wird nicht angezeigt           | Warten Sie, bis die VM vollständig gestartet ist, führen Sie `lume get openclaw` erneut aus                  |
| Lume-Befehl nicht gefunden           | Fügen Sie `~/.local/bin` zu Ihrem PATH hinzu                                                                |
| WhatsApp-QR wird nicht gescannt      | Stellen Sie sicher, dass Sie in der VM angemeldet sind (nicht auf dem Host), wenn Sie `openclaw channels login` ausführen |

---

## Verwandte Dokumentation

- [VPS-Hosting](/de/vps)
- [Nodes](/de/nodes)
- [Remote-Gateway](/de/gateway/remote)
- [BlueBubbles-Kanal](/de/channels/bluebubbles)
- [Lume-Schnellstart](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume-CLI-Referenz](https://cua.ai/docs/lume/reference/cli-reference)
- [Unbeaufsichtigte VM-Einrichtung](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (fortgeschritten)
- [Docker-Sandboxing](/de/install/docker) (alternativer Isolierungsansatz)
