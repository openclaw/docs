---
read_when:
    - Sie möchten OpenClaw von Ihrer primären macOS-Umgebung isolieren
    - Sie möchten eine iMessage-Integration (BlueBubbles) in einer Sandbox
    - Sie möchten eine zurücksetzbare macOS-Umgebung, die Sie klonen können
    - Sie möchten lokale mit gehosteten macOS-VM-Optionen vergleichen
summary: Führen Sie OpenClaw in einer sandboxierten macOS-VM (lokal oder gehostet) aus, wenn Sie Isolierung oder iMessage benötigen
title: macOS-VMs
x-i18n:
    generated_at: "2026-04-30T07:01:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49cd3d420db02bcdb80378c3a91a1c1243e7be2012525c31de1dd49db397d560
    source_path: install/macos-vm.md
    workflow: 16
---

# OpenClaw auf macOS-VMs (Sandboxing)

## Empfohlener Standard (die meisten Benutzer)

- **Kleiner Linux-VPS** für einen dauerhaft laufenden Gateway und niedrige Kosten. Siehe [VPS-Hosting](/de/vps).
- **Dedizierte Hardware** (Mac mini oder Linux-Rechner), wenn Sie volle Kontrolle und eine **private IP-Adresse** für Browserautomatisierung möchten. Viele Websites blockieren Rechenzentrums-IPs, daher funktioniert lokales Browsen oft besser.
- **Hybrid:** Betreiben Sie den Gateway auf einem günstigen VPS und verbinden Sie Ihren Mac als **Node**, wenn Sie Browser-/UI-Automatisierung benötigen. Siehe [Nodes](/de/nodes) und [Gateway remote](/de/gateway/remote).

Verwenden Sie eine macOS-VM, wenn Sie ausdrücklich macOS-spezifische Funktionen (iMessage/BlueBubbles) benötigen oder eine strikte Isolation von Ihrem täglichen Mac wünschen.

## macOS-VM-Optionen

### Lokale VM auf Ihrem Apple-Silicon-Mac (Lume)

Führen Sie OpenClaw in einer sandboxed macOS-VM auf Ihrem vorhandenen Apple-Silicon-Mac mit [Lume](https://cua.ai/docs/lume) aus.

Das bietet Ihnen:

- Vollständige macOS-Umgebung in Isolation (Ihr Host bleibt sauber)
- iMessage-Unterstützung über BlueBubbles (unter Linux/Windows unmöglich)
- Sofortiges Zurücksetzen durch Klonen von VMs
- Keine zusätzliche Hardware- oder Cloud-Kosten

### Gehostete Mac-Provider (Cloud)

Wenn Sie macOS in der Cloud möchten, funktionieren gehostete Mac-Provider ebenfalls:

- [MacStadium](https://www.macstadium.com/) (gehostete Macs)
- Andere gehostete Mac-Anbieter funktionieren ebenfalls; folgen Sie deren VM- und SSH-Dokumentation

Sobald Sie SSH-Zugriff auf eine macOS-VM haben, fahren Sie mit Schritt 6 unten fort.

---

## Schneller Weg (Lume, erfahrene Benutzer)

1. Lume installieren
2. `lume create openclaw --os macos --ipsw latest`
3. Einrichtungsassistenten abschließen, Remote Login (SSH) aktivieren
4. `lume run openclaw --no-display`
5. Per SSH anmelden, OpenClaw installieren, Kanäle konfigurieren
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

Wenn `~/.local/bin` nicht in Ihrem PATH enthalten ist:

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

## 3) Einrichtungsassistenten abschließen

Im VNC-Fenster:

1. Sprache und Region auswählen
2. Apple-ID überspringen (oder anmelden, wenn Sie iMessage später verwenden möchten)
3. Benutzerkonto erstellen (Benutzername und Passwort merken)
4. Alle optionalen Funktionen überspringen

Nachdem die Einrichtung abgeschlossen ist, aktivieren Sie SSH:

1. Systemeinstellungen öffnen → Allgemein → Teilen
2. "Remote Login" aktivieren

---

## 4) IP-Adresse der VM abrufen

```bash
lume get openclaw
```

Suchen Sie nach der IP-Adresse (normalerweise `192.168.64.x`).

---

## 5) Per SSH in der VM anmelden

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

Folgen Sie den Onboarding-Eingabeaufforderungen, um Ihren Modell-Provider einzurichten (Anthropic, OpenAI usw.).

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

Die VM läuft im Hintergrund. Der Daemon von OpenClaw hält den Gateway am Laufen.

Status prüfen:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Bonus: iMessage-Integration

Dies ist das wichtigste Feature beim Betrieb auf macOS. Verwenden Sie [BlueBubbles](https://bluebubbles.app), um iMessage zu OpenClaw hinzuzufügen.

Innerhalb der VM:

1. BlueBubbles von bluebubbles.app herunterladen
2. Mit Ihrer Apple-ID anmelden
3. Web API aktivieren und ein Passwort festlegen
4. BlueBubbles-Webhooks auf Ihren Gateway richten (Beispiel: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

Zu Ihrer OpenClaw-Konfiguration hinzufügen:

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

Starten Sie den Gateway neu. Ihr Agent kann nun iMessages senden und empfangen.

Vollständige Einrichtungsdetails: [BlueBubbles-Kanal](/de/channels/bluebubbles)

---

## Golden Image speichern

Erstellen Sie einen Snapshot Ihres sauberen Zustands, bevor Sie weitere Anpassungen vornehmen:

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

## 24/7-Betrieb

Halten Sie die VM am Laufen, indem Sie:

- Ihren Mac am Strom angeschlossen lassen
- Ruhezustand in Systemeinstellungen → Energie sparen deaktivieren
- Bei Bedarf `caffeinate` verwenden

Für echten Dauerbetrieb sollten Sie einen dedizierten Mac mini oder einen kleinen VPS in Betracht ziehen. Siehe [VPS-Hosting](/de/vps).

---

## Fehlerbehebung

| Problem                  | Lösung                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------- |
| SSH in die VM nicht möglich | Prüfen Sie, ob "Remote Login" in den Systemeinstellungen der VM aktiviert ist       |
| VM-IP wird nicht angezeigt | Warten Sie, bis die VM vollständig gestartet ist, und führen Sie `lume get openclaw` erneut aus |
| Lume-Befehl nicht gefunden | Fügen Sie `~/.local/bin` zu Ihrem PATH hinzu                                       |
| WhatsApp-QR wird nicht gescannt | Stellen Sie sicher, dass Sie in der VM angemeldet sind (nicht auf dem Host), wenn Sie `openclaw channels login` ausführen |

---

## Verwandte Dokumentation

- [VPS-Hosting](/de/vps)
- [Nodes](/de/nodes)
- [Gateway remote](/de/gateway/remote)
- [BlueBubbles-Kanal](/de/channels/bluebubbles)
- [Lume-Schnellstart](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume-CLI-Referenz](https://cua.ai/docs/lume/reference/cli-reference)
- [Unbeaufsichtigte VM-Einrichtung](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (fortgeschritten)
- [Docker-Sandboxing](/de/install/docker) (alternativer Isolationsansatz)
