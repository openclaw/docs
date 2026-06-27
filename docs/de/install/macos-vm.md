---
read_when:
    - Sie möchten OpenClaw von Ihrer macOS-Hauptumgebung isolieren
    - Sie möchten eine iMessage-Integration in einer Sandbox
    - Sie möchten eine zurücksetzbare macOS-Umgebung, die Sie klonen können
    - Sie möchten lokale mit gehosteten macOS-VM-Optionen vergleichen
summary: Führen Sie OpenClaw in einer sandboxed macOS-VM (lokal oder gehostet) aus, wenn Sie Isolation oder iMessage benötigen.
title: macOS-VMs
x-i18n:
    generated_at: "2026-06-27T17:38:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aee2fa0651b711f29d7d092da931bd924bc8ce8a5ca389cf8f189725fa586f3f
    source_path: install/macos-vm.md
    workflow: 16
---

## Empfohlene Standardeinstellung (die meisten Benutzer)

- **Kleiner Linux-VPS** für einen durchgehend aktiven Gateway zu niedrigen Kosten. Siehe [VPS-Hosting](/de/vps).
- **Dedizierte Hardware** (Mac mini oder Linux-Rechner), wenn Sie volle Kontrolle und eine **private IP-Adresse** für Browser-Automatisierung möchten. Viele Websites blockieren IP-Adressen von Rechenzentren, daher funktioniert lokales Browsen oft besser.
- **Hybrid:** Lassen Sie den Gateway auf einem günstigen VPS laufen und verbinden Sie Ihren Mac als **Node**, wenn Sie Browser-/UI-Automatisierung benötigen. Siehe [Nodes](/de/nodes) und [Gateway remote](/de/gateway/remote).

Verwenden Sie eine macOS-VM, wenn Sie gezielt macOS-exklusive Funktionen wie iMessage benötigen oder strikte Isolation von Ihrem täglich genutzten Mac wünschen.

## macOS-VM-Optionen

### Lokale VM auf Ihrem Apple-Silicon-Mac (Lume)

Führen Sie OpenClaw in einer isolierten macOS-VM auf Ihrem vorhandenen Apple-Silicon-Mac mit [Lume](https://cua.ai/docs/lume) aus.

Das bietet Ihnen:

- Vollständige macOS-Umgebung in Isolation (Ihr Host bleibt sauber)
- iMessage-Unterstützung über `imsg` (der standardmäßige lokale Pfad ist unter Linux/Windows nicht möglich)
- Sofortiges Zurücksetzen durch Klonen von VMs
- Keine zusätzliche Hardware und keine Cloud-Kosten

### Gehostete Mac-Provider (Cloud)

Wenn Sie macOS in der Cloud möchten, funktionieren gehostete Mac-Provider ebenfalls:

- [MacStadium](https://www.macstadium.com/) (gehostete Macs)
- Andere gehostete Mac-Anbieter funktionieren ebenfalls; folgen Sie deren VM- und SSH-Dokumentation

Sobald Sie SSH-Zugriff auf eine macOS-VM haben, fahren Sie unten mit Schritt 6 fort.

---

## Schnellweg (Lume, erfahrene Benutzer)

1. Lume installieren
2. `lume create openclaw --os macos --ipsw latest`
3. Einrichtungsassistent abschließen, Entfernte Anmeldung (SSH) aktivieren
4. `lume run openclaw --no-display`
5. Per SSH verbinden, OpenClaw installieren, Kanäle konfigurieren
6. Fertig

---

## Was Sie benötigen (Lume)

- Apple-Silicon-Mac (M1/M2/M3/M4)
- macOS Sequoia oder neuer auf dem Host
- ca. 60 GB freier Speicherplatz pro VM
- ca. 20 Minuten

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

## 3) Einrichtungsassistent abschließen

Im VNC-Fenster:

1. Sprache und Region auswählen
2. Apple-ID überspringen (oder anmelden, wenn Sie später iMessage verwenden möchten)
3. Benutzerkonto erstellen (Benutzername und Passwort merken)
4. Alle optionalen Funktionen überspringen

Nachdem die Einrichtung abgeschlossen ist:

1. SSH aktivieren: Öffnen Sie Systemeinstellungen -> Allgemein -> Freigaben und aktivieren Sie „Entfernte Anmeldung“.
2. Für die Nutzung der VM ohne Anzeige aktivieren Sie die automatische Anmeldung: Öffnen Sie Systemeinstellungen -> Benutzer & Gruppen, wählen Sie „Automatisch anmelden als:“ und wählen Sie den VM-Benutzer.

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

Ersetzen Sie `youruser` durch das von Ihnen erstellte Konto und die IP-Adresse durch die IP-Adresse Ihrer VM.

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

Melden Sie sich dann bei WhatsApp an (QR-Code scannen):

```bash
openclaw channels login
```

---

## 8) VM ohne Anzeige ausführen

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

Dies ist die wichtigste Funktion beim Betrieb unter macOS. Verwenden Sie [iMessage](/de/channels/imessage) mit `imsg`, um Nachrichten zu OpenClaw hinzuzufügen.

Innerhalb der VM:

1. Bei Nachrichten anmelden.
2. `imsg` installieren.
3. Vollzugriff auf die Festplatte und Automatisierungsberechtigungen für den Prozess gewähren, der OpenClaw/`imsg` ausführt.
4. RPC-Unterstützung mit `imsg rpc --help` überprüfen.

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

Starten Sie den Gateway neu. Jetzt kann Ihr Agent iMessages senden und empfangen.

Vollständige Einrichtungsdetails: [iMessage-Kanal](/de/channels/imessage)

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

## Rund um die Uhr ausführen

Halten Sie die VM am Laufen, indem Sie:

- Ihren Mac am Strom angeschlossen lassen
- den Ruhezustand in Systemeinstellungen → Energie sparen deaktivieren
- bei Bedarf `caffeinate` verwenden

Für echten Dauerbetrieb sollten Sie einen dedizierten Mac mini oder einen kleinen VPS in Betracht ziehen. Siehe [VPS-Hosting](/de/vps).

---

## Fehlerbehebung

| Problem                              | Lösung                                                                                                         |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| SSH-Verbindung zur VM nicht möglich  | Prüfen Sie, ob „Entfernte Anmeldung“ in den Systemeinstellungen der VM aktiviert ist                           |
| VM-IP wird nicht angezeigt           | Warten Sie, bis die VM vollständig gestartet ist, und führen Sie `lume get openclaw` erneut aus                 |
| Lume-Befehl nicht gefunden           | Fügen Sie `~/.local/bin` zu Ihrem PATH hinzu                                                                   |
| WhatsApp-QR-Code wird nicht gescannt | Stellen Sie sicher, dass Sie in der VM angemeldet sind (nicht auf dem Host), wenn Sie `openclaw channels login` ausführen |

---

## Verwandte Dokumentation

- [VPS-Hosting](/de/vps)
- [Nodes](/de/nodes)
- [Gateway remote](/de/gateway/remote)
- [iMessage-Kanal](/de/channels/imessage)
- [Lume-Schnellstart](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume-CLI-Referenz](https://cua.ai/docs/lume/reference/cli-reference)
- [Unbeaufsichtigte VM-Einrichtung](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (fortgeschritten)
- [Docker-Sandboxing](/de/install/docker) (alternativer Isolationsansatz)
