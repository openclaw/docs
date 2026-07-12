---
read_when:
    - Einrichten oder Debuggen der Mac-Fernsteuerung
summary: macOS-App-Ablauf zur Steuerung eines entfernten OpenClaw-Gateways
title: Fernsteuerung
x-i18n:
    generated_at: "2026-07-12T15:31:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bd3ee71838737c1b8cf67d91d00b135283f4284400c75309646e62921e8c3633
    source_path: platforms/mac/remote.md
    workflow: 16
---

Dieser Ablauf ermöglicht es der macOS-App, als vollständige Fernsteuerung für ein OpenClaw-Gateway zu fungieren, das auf einem anderen Host (Desktop/Server) ausgeführt wird. Die App stellt eine direkte Verbindung zu vertrauenswürdigen LAN-/Tailnet-Gateway-URLs her oder verwaltet einen SSH-Tunnel, wenn das Remote-Gateway nur über Loopback erreichbar ist. Zustandsprüfungen, die Weiterleitung von Voice Wake und Web Chat verwenden dieselbe Remote-Konfiguration aus _Settings -> General_.

## Modi

- **Lokal (dieser Mac)**: Alles wird auf dem Laptop ausgeführt; SSH ist nicht beteiligt.
- **Remote über SSH (Standard)**: OpenClaw-Befehle werden auf dem Remote-Host ausgeführt. Die App öffnet eine SSH-Verbindung mit `-o BatchMode`, Ihrer ausgewählten Identität beziehungsweise Ihrem Schlüssel und einer lokalen Portweiterleitung.
- **Direkt remote (ws/wss)**: Kein SSH-Tunnel; die App stellt direkt eine Verbindung zur Gateway-URL her (LAN, Tailscale, Tailscale Serve oder ein öffentlicher HTTPS-Reverse-Proxy).

## Remote-Transporte

- **SSH-Tunnel** (Standard): Verwendet `ssh -N -L ...`, um den Gateway-Port an localhost weiterzuleiten. Das Gateway sieht die IP-Adresse des Nodes als `127.0.0.1`, da der Tunnel über Loopback verläuft.
- **Direkt (ws/wss)**: Stellt unmittelbar eine Verbindung zur Gateway-URL her. Das Gateway sieht die tatsächliche Client-IP-Adresse.

Die App deaktiviert für ihre eigenen SSH-Prozesse das Multiplexing von SSH-Verbindungen und die Verlagerung in den Hintergrund nach der Authentifizierung, damit sie den konkreten Prozess überwachen und neu starten kann, selbst wenn der ausgewählte Alias `ControlMaster` oder `ForkAfterAuthentication` aktiviert.

Die Überprüfung des SSH-Hostschlüssels ist standardmäßig strikt, da die Gateway-Anmeldedaten durch diesen Tunnel übertragen werden. Um stattdessen das eigene Vertrauensverhalten eines verwalteten SSH-Alias zu verwenden, legen Sie über `openclaw-mac configure-remote` die Option `--ssh-host-key-policy openssh` fest oder setzen Sie `gateway.remote.sshHostKeyPolicy` direkt auf `"openssh"`. Prüfen Sie den Alias und alle zutreffenden `Host *`- oder Systemkonfigurationen, bevor Sie diese Option aktivieren. Wenn Sie das SSH-Ziel ändern (in der App oder über `configure-remote`), wird die Richtlinie wieder auf `strict` zurückgesetzt, sofern Sie sie für das neue Ziel nicht erneut ausdrücklich aktivieren.

Im SSH-Tunnelmodus werden erkannte LAN-/Tailnet-Hostnamen als `gateway.remote.sshTarget` gespeichert. Die App belässt `gateway.remote.url` auf dem lokalen Tunnelendpunkt (beispielsweise `ws://127.0.0.1:18789`), damit CLI, Web Chat und der lokale Node-Host-Dienst denselben Loopback-Transport verwenden. Wenn die Erkennung sowohl reine Tailnet-IP-Adressen als auch stabile Hostnamen zurückgibt, bevorzugt die App Tailscale-MagicDNS- oder LAN-Namen, damit Verbindungen Adressänderungen besser überstehen. Wenn sich der lokale Tunnelport vom Port des Remote-Gateways unterscheidet, setzen Sie `gateway.remote.remotePort` auf den Port des Remote-Hosts.

Die Browserautomatisierung im Remote-Modus liegt in der Verantwortung des CLI-Node-Hosts, nicht des nativen Nodes der macOS-App. Die App startet nach Möglichkeit den installierten Node-Host-Dienst. Um die Browsersteuerung von diesem Mac aus zu aktivieren, installieren und starten Sie ihn mit `openclaw node install ...` und `openclaw node start` (oder führen Sie `openclaw node run ...` im Vordergrund aus) und wählen Sie anschließend diesen browserfähigen Node als Ziel aus.

## Voraussetzungen auf dem Remote-Host

1. Installieren Sie Node und pnpm und erstellen beziehungsweise installieren Sie die OpenClaw-CLI (`pnpm install && pnpm build && pnpm link --global`).
2. Stellen Sie sicher, dass `openclaw` für nicht interaktive Shells im PATH enthalten ist (erstellen Sie bei Bedarf einen symbolischen Link in `/usr/local/bin` oder `/opt/homebrew/bin`).
3. Für den SSH-Transport: Richten Sie eine schlüsselbasierte SSH-Authentifizierung ein. Tailscale-IP-Adressen werden für eine stabile Erreichbarkeit außerhalb des LANs empfohlen.

## Einrichtung der macOS-App

Um die App ohne den Begrüßungsablauf über SSH vorzukonfigurieren:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway-host \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Oder überspringen Sie SSH vollständig, wenn das Gateway bereits über ein vertrauenswürdiges LAN oder Tailnet erreichbar ist:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Beide Varianten schreiben `~/.openclaw/openclaw.json`, markieren das Onboarding als abgeschlossen und ermöglichen der App, beim nächsten Start den ausgewählten Transport zu verwalten. `--local-port`/`--remote-port` verwenden standardmäßig `18789`. Weitere Optionen: `--password`, `--identity <path>`, `--ssh-host-key-policy <strict|openssh>`, `--project-root <path>`, `--cli-path <path>`, `--json`. Führen Sie `openclaw-mac configure-remote --help` aus, um die vollständige Referenz anzuzeigen.

So konfigurieren Sie die App stattdessen über die Benutzeroberfläche:

1. Öffnen Sie _Settings -> General_.
2. Wählen Sie unter **OpenClaw runs** die Option **Remote** aus und legen Sie Folgendes fest:
   - **Transport**: **SSH tunnel** oder **Direct (ws/wss)**.
   - **SSH target**: `user@host` (optional `:port`). Wenn sich das Gateway im selben LAN befindet und über Bonjour angekündigt wird, wählen Sie es aus der Liste der erkannten Geräte aus, um dieses Feld automatisch auszufüllen.
   - **Gateway URL** (nur Direct): `wss://gateway.example.ts.net` (oder `ws://...` für lokal/LAN).
   - **Identity file** (erweitert): Pfad zu Ihrem Schlüssel.
   - **Project root** (erweitert): Pfad zum Remote-Checkout, der für Befehle verwendet wird.
   - **CLI path** (erweitert): Optionaler Pfad zu einem ausführbaren `openclaw`-Einstiegspunkt beziehungsweise einer Binärdatei (wird bei Ankündigung automatisch ausgefüllt).
3. Klicken Sie auf **Test remote**. Eine erfolgreiche Prüfung bedeutet, dass der Remote-Befehl `openclaw status --json` korrekt ausgeführt wurde. Fehler weisen normalerweise auf Probleme mit PATH oder der CLI hin; Exit-Code 127 bedeutet, dass die CLI auf dem Remote-System nicht gefunden wurde.
4. Zustandsprüfungen und Web Chat werden nun automatisch über den ausgewählten Transport ausgeführt.

## Web Chat

- **SSH-Tunnel**: Stellt über den weitergeleiteten WebSocket-Steuerungsport (standardmäßig 18789) eine Verbindung zum Gateway her.
- **Direkt (ws/wss)**: Stellt unmittelbar eine Verbindung zur konfigurierten Gateway-URL her.
- Es gibt keinen separaten HTTP-Server für Web Chat.

## Berechtigungen

- Der Remote-Host benötigt dieselben TCC-Genehmigungen wie ein lokaler Host (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Führen Sie das Onboarding einmal auf diesem Rechner aus, um sie zu erteilen.
- Nodes geben ihren Berechtigungsstatus über `node.list` / `node.describe` bekannt, damit Agenten wissen, was verfügbar ist.

## Sicherheitshinweise

- Bevorzugen Sie Loopback-Bindungen auf dem Remote-Host und stellen Sie die Verbindung über SSH, Tailscale Serve oder eine vertrauenswürdige direkte Tailnet-/LAN-URL her.
- SSH-Tunneling setzt standardmäßig einen bereits vertrauenswürdigen Hostschlüssel voraus. Vertrauen Sie zunächst dem Hostschlüssel (fügen Sie ihn der konfigurierten Known-Hosts-Datei hinzu) oder setzen Sie ausdrücklich `gateway.remote.sshHostKeyPolicy: "openssh"` für einen verwalteten Alias, dessen OpenSSH-Vertrauensrichtlinie Sie akzeptieren.
- Wenn Sie das Gateway an eine andere Schnittstelle als Loopback binden, müssen Sie eine gültige Gateway-Authentifizierung voraussetzen: Token, Passwort oder einen identitätsbewussten Reverse-Proxy mit `gateway.auth.mode: "trusted-proxy"`.
- Weitere Informationen finden Sie unter [Sicherheit](/de/gateway/security) und [Tailscale](/de/gateway/tailscale).

## WhatsApp-Anmeldeablauf (remote)

- Führen Sie `openclaw channels login --channel whatsapp --verbose` **auf dem Remote-Host** aus. Scannen Sie den QR-Code mit WhatsApp auf Ihrem Telefon.
- Wiederholen Sie die Anmeldung auf diesem Host, wenn die Authentifizierung abläuft. Die Zustandsprüfung zeigt Verbindungsprobleme an.

## Fehlerbehebung

| Symptom                                          | Ursache / Behebung                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exit 127` / nicht gefunden                      | `openclaw` befindet sich bei Nicht-Login-Shells nicht im PATH. Fügen Sie es zu `/etc/paths` oder Ihrer Shell-RC-Datei hinzu oder erstellen Sie einen Symlink in `/usr/local/bin`/`/opt/homebrew/bin`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Integritätsprüfung fehlgeschlagen                | Prüfen Sie die SSH-Erreichbarkeit, den PATH und ob Baileys (WhatsApp) angemeldet ist (`openclaw status --json`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Web Chat reagiert nicht                          | Vergewissern Sie sich, dass der Gateway auf dem Remote-Host ausgeführt wird und der weitergeleitete Port dem WS-Port des Gateways entspricht; die Benutzeroberfläche benötigt eine intakte WS-Verbindung.                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Node-IP zeigt `127.0.0.1`                        | Dies ist beim SSH-Tunnel zu erwarten. Stellen Sie **Transport** auf **Direct (ws/wss)** um, wenn der Gateway die tatsächliche Client-IP sehen soll.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Dashboard funktioniert, aber Mac-Funktionen sind offline | Die Bediener-/Steuerungsverbindung ist intakt, aber die Verbindung zur begleitenden Node ist nicht hergestellt oder ihre Befehlsschnittstelle fehlt. Öffnen Sie in der Menüleiste den Gerätebereich und prüfen Sie, ob der Mac als `paired · disconnected` angezeigt wird. Bei Tailscale-Serve-Endpunkten unter `wss://*.ts.net` erkennt die App nach einer Zertifikatsrotation veraltete Legacy-Pins für TLS-Endzertifikate, löscht den veralteten Pin, sobald macOS dem neuen Zertifikat vertraut, und versucht die Verbindung automatisch erneut. Wenn das Zertifikat nicht vom System als vertrauenswürdig eingestuft wird oder der Host kein Tailscale-Serve-Name ist, setzen Sie `gateway.remote.tlsFingerprint` auf den erwarteten Zertifikat-Fingerabdruck, überprüfen Sie das Zertifikat oder wechseln Sie zu **Remote über SSH**. |
| Sprachaktivierung                                | Auslösephrasen werden im Remote-Modus automatisch weitergeleitet; eine separate Weiterleitungskomponente ist nicht erforderlich.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

## Benachrichtigungstöne

Wählen Sie mit `openclaw nodes notify` für jede Benachrichtigung einen Ton aus Skripten aus, zum Beispiel:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote-Gateway bereit" --sound Glass
```

In der App gibt es keinen globalen Schalter für einen Standardton; die Aufrufer wählen pro Anfrage einen Ton (oder keinen) aus.

## Verwandte Themen

- [macOS-App](/de/platforms/macos)
- [Remote-Zugriff](/de/gateway/remote)
