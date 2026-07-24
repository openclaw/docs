---
read_when:
    - Remote-Mac-Steuerung einrichten oder debuggen
summary: macOS-App-Ablauf zur Steuerung eines entfernten OpenClaw-Gateways
title: Fernsteuerung
x-i18n:
    generated_at: "2026-07-24T05:10:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7e558c39fa173a77bf11270a8961c14c6e2350dfc4f458da3633532513b98bf6
    source_path: platforms/mac/remote.md
    workflow: 16
---

Dieser Ablauf ermöglicht es der macOS-App, als vollständige Fernsteuerung für ein OpenClaw-Gateway zu dienen, das auf einem anderen Host (Desktop/Server) ausgeführt wird. Die App stellt eine direkte Verbindung zu vertrauenswürdigen Gateway-URLs im LAN/Tailnet her oder verwaltet einen SSH-Tunnel, wenn das Remote-Gateway nur über Loopback erreichbar ist. Zustandsprüfungen, die Weiterleitung von Voice Wake und Web Chat verwenden dieselbe Remote-Konfiguration aus _Settings -> General_.

## Modi

- **Lokal (dieser Mac)**: Alles wird auf dem Laptop ausgeführt; SSH ist nicht beteiligt.
- **Remote über SSH (Standard)**: OpenClaw-Befehle werden auf dem Remote-Host ausgeführt. Die App öffnet eine SSH-Verbindung mit `-o BatchMode`, Ihrer ausgewählten Identität/Ihrem ausgewählten Schlüssel und einer lokalen Portweiterleitung.
- **Direkt remote (ws/wss)**: kein SSH-Tunnel; die App stellt eine direkte Verbindung zur Gateway-URL her (LAN, Tailscale, Tailscale Serve oder ein öffentlicher HTTPS-Reverse-Proxy).

## Remote-Übertragungsarten

- **SSH-Tunnel** (Standard): Verwendet `ssh -N -L ...`, um den Gateway-Port an localhost weiterzuleiten. Das Gateway sieht die IP-Adresse des Nodes als `127.0.0.1`, da der Tunnel über Loopback läuft.
- **Direkt (ws/wss)**: Stellt eine direkte Verbindung zur Gateway-URL her. Das Gateway sieht die tatsächliche Client-IP-Adresse.

Die App deaktiviert für ihre eigenen SSH-Prozesse das Multiplexing von SSH-Verbindungen sowie die Verlagerung in den Hintergrund nach der Authentifizierung, damit sie den konkreten Prozess überwachen und neu starten kann, selbst wenn der ausgewählte Alias `ControlMaster` oder `ForkAfterAuthentication` aktiviert.

Die Überprüfung des SSH-Hostschlüssels ist standardmäßig strikt, da Gateway-Anmeldedaten durch diesen Tunnel übertragen werden. Um stattdessen das eigene Vertrauensverhalten eines verwalteten SSH-Alias zu verwenden, setzen Sie `--ssh-host-key-policy openssh` über `openclaw-mac configure-remote` oder setzen Sie `gateway.remote.sshHostKeyPolicy` direkt auf `"openssh"`. Überprüfen Sie den Alias sowie alle zutreffenden `Host *`- oder Systemkonfigurationen, bevor Sie diese Option aktivieren. Wenn das SSH-Ziel geändert wird (in der App oder über `configure-remote`), wird die Richtlinie auf `strict` zurückgesetzt, sofern Sie sie für das neue Ziel nicht erneut ausdrücklich aktivieren.

Im SSH-Tunnelmodus werden erkannte LAN-/Tailnet-Hostnamen als `gateway.remote.sshTarget` gespeichert. Die App belässt `gateway.remote.url` auf dem lokalen Tunnelendpunkt (zum Beispiel `ws://127.0.0.1:18789`), sodass CLI, Web Chat und der lokale Node-Host-Dienst denselben Loopback-Transport verwenden. Wenn die Erkennung sowohl direkte Tailnet-IP-Adressen als auch stabile Hostnamen zurückgibt, bevorzugt die App Tailscale-MagicDNS- oder LAN-Namen, damit Verbindungen Adressänderungen besser überstehen. Wenn sich der lokale Tunnelport vom Port des Remote-Gateways unterscheidet, setzen Sie `gateway.remote.remotePort` auf den Port des Remote-Hosts.

Die Browserautomatisierung im Remote-Modus gehört zum CLI-Node-Host, nicht zum nativen Node der macOS-App. Die App startet nach Möglichkeit den installierten Node-Host-Dienst. Um die Browsersteuerung von diesem Mac aus zu aktivieren, installieren/starten Sie ihn mit `openclaw node install ...` und `openclaw node start` (oder führen Sie `openclaw node run ...` im Vordergrund aus) und wählen Sie anschließend diesen browserfähigen Node als Ziel aus.

## Voraussetzungen auf dem Remote-Host

1. Installieren Sie Node und pnpm und erstellen/installieren Sie die OpenClaw-CLI (`pnpm install && pnpm build && pnpm link --global`).
2. Stellen Sie sicher, dass sich `openclaw` für nicht interaktive Shells im PATH befindet (erstellen Sie bei Bedarf einen Symlink in `/usr/local/bin` oder `/opt/homebrew/bin`).
3. Für die SSH-Übertragung: Richten Sie die schlüsselbasierte SSH-Authentifizierung ein. Tailscale-IP-Adressen werden für eine stabile Erreichbarkeit außerhalb des LAN empfohlen.

## Einrichtung der macOS-App

So konfigurieren Sie die App ohne den Begrüßungsablauf über SSH vor:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway-host \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Für ein Gateway, das bereits in einem vertrauenswürdigen LAN oder Tailnet erreichbar ist, können Sie SSH vollständig überspringen:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

`openclaw-mac connect`, `wizard` und `configure-remote` ermitteln die aktive Konfiguration in dieser Reihenfolge: `OPENCLAW_CONFIG_PATH`, dann `$OPENCLAW_STATE_DIR/openclaw.json`, dann `~/.openclaw/openclaw.json`. Beide Konfigurationsformen schreiben diese aktive Datei, markieren das Onboarding als abgeschlossen und überlassen der App beim nächsten Start die Verwaltung der ausgewählten Übertragungsart. `--local-port`/`--remote-port` verwenden standardmäßig `18789`. Weitere Flags: `--password`, `--identity <path>`, `--ssh-host-key-policy <strict|openssh>`, `--project-root <path>`, `--cli-path <path>`, `--json`. Führen Sie `openclaw-mac configure-remote --help` aus, um die vollständige Referenz anzuzeigen.

So nehmen Sie die Konfiguration stattdessen über die Benutzeroberfläche vor:

1. Öffnen Sie _Settings -> General_.
2. Wählen Sie unter **OpenClaw runs** die Option **Remote** aus und legen Sie Folgendes fest:
   - **Transport**: **SSH tunnel** oder **Direct (ws/wss)**.
   - **SSH target**: `user@host` (optional `:port`). Wenn sich das Gateway im selben LAN befindet und über Bonjour angekündigt wird, wählen Sie es in der Liste der erkannten Geräte aus, um dieses Feld automatisch auszufüllen.
   - **Gateway URL** (nur Direct): `wss://gateway.example.ts.net` (oder `ws://...` für lokal/LAN).
   - **Identity file** (erweitert): Pfad zu Ihrem Schlüssel.
   - **Project root** (erweitert): Pfad zum Remote-Checkout, der für Befehle verwendet wird.
   - **CLI path** (erweitert): optionaler Pfad zu einem ausführbaren `openclaw`-Einstiegspunkt/Binärprogramm (wird automatisch ausgefüllt, wenn er angekündigt wird).
3. Klicken Sie auf **Test remote**. Ein erfolgreicher Test bedeutet, dass der Remote-Befehl `openclaw status --json` ordnungsgemäß ausgeführt wurde. Fehler weisen in der Regel auf Probleme mit PATH/CLI hin; Exit-Code 127 bedeutet, dass die CLI auf dem Remote-System nicht gefunden wurde.
4. Zustandsprüfungen und Web Chat werden nun automatisch über die ausgewählte Übertragungsart ausgeführt.

## Web Chat

- **SSH-Tunnel**: Stellt über den weitergeleiteten WebSocket-Steuerungsport eine Verbindung zum Gateway her (Standard: 18789).
- **Direkt (ws/wss)**: Stellt eine direkte Verbindung zur konfigurierten Gateway-URL her.
- Es gibt keinen separaten HTTP-Server für Web Chat.

## Berechtigungen

- Der Remote-Host benötigt dieselben TCC-Genehmigungen wie ein lokaler Host (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Führen Sie das Onboarding einmal auf diesem Computer aus, um sie zu erteilen.
- Nodes geben ihren Berechtigungsstatus über `node.list` / `node.describe` bekannt, sodass Agenten wissen, was verfügbar ist.

## Sicherheitshinweise

- Bevorzugen Sie Loopback-Bindungen auf dem Remote-Host und stellen Sie die Verbindung über SSH, Tailscale Serve oder eine vertrauenswürdige direkte Tailnet-/LAN-URL her.
- SSH-Tunneling erfordert standardmäßig einen bereits vertrauenswürdigen Hostschlüssel. Vertrauen Sie zuerst dem Hostschlüssel (fügen Sie ihn der konfigurierten Known-Hosts-Datei hinzu) oder setzen Sie ausdrücklich `gateway.remote.sshHostKeyPolicy: "openssh"` für einen verwalteten Alias, dessen OpenSSH-Vertrauensrichtlinie Sie akzeptieren.
- Wenn Sie das Gateway an eine Nicht-Loopback-Schnittstelle binden, verlangen Sie eine gültige Gateway-Authentifizierung: Token, Passwort oder einen identitätsbewussten Reverse-Proxy mit `gateway.auth.mode: "trusted-proxy"`.
- Direkte `wss://`-Verbindungen wenden eine Zertifikatsrichtlinie sowohl auf den Bediener-/Steuerungsverkehr als auch auf den Mac-Begleit-Node an. Setzen Sie `gateway.remote.tlsFingerprint` für eine explizite Bindung. Ohne eine solche Bindung zeichnet die App erst nach erfolgreicher normaler macOS-Vertrauensprüfung eine Bindung bei der ersten Verwendung auf.
- Siehe [Sicherheit](/de/gateway/security) und [Tailscale](/de/gateway/tailscale).

## WhatsApp-Anmeldeablauf (remote)

- Führen Sie `openclaw channels login --channel whatsapp --verbose` **auf dem Remote-Host** aus. Scannen Sie den QR-Code mit WhatsApp auf Ihrem Telefon.
- Wiederholen Sie die Anmeldung auf diesem Host, wenn die Authentifizierung abläuft. Die Zustandsprüfung zeigt Verknüpfungsprobleme an.

## Fehlerbehebung

| Symptom                                          | Ursache / Behebung                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exit 127` / nicht gefunden                           | `openclaw` befindet sich für Nicht-Login-Shells nicht im PATH. Fügen Sie es zu `/etc/paths` oder zur RC-Datei Ihrer Shell hinzu oder erstellen Sie einen Symlink in `/usr/local/bin`/`/opt/homebrew/bin`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Integritätsprüfung fehlgeschlagen                              | Prüfen Sie die SSH-Erreichbarkeit, den PATH und ob Baileys (WhatsApp) angemeldet ist (`openclaw status --json`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Web Chat reagiert nicht                                   | Vergewissern Sie sich, dass der Gateway auf dem Remote-Host ausgeführt wird und der weitergeleitete Port dem WS-Port des Gateways entspricht; die Benutzeroberfläche benötigt eine fehlerfreie WS-Verbindung.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Node-IP zeigt `127.0.0.1`                        | Beim SSH-Tunnel ist dies zu erwarten. Stellen Sie **Transport** auf **Direct (ws/wss)** um, wenn der Gateway die tatsächliche Client-IP sehen soll.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Dashboard funktioniert, aber Mac-Funktionen sind offline | Die Operator-/Steuerungsverbindung ist fehlerfrei, aber die Verbindung zum begleitenden Node ist nicht hergestellt oder dessen Befehlsoberfläche fehlt. Öffnen Sie im Menüleistenmenü den Gerätebereich und prüfen Sie, ob der Mac `paired · disconnected` ist. Direkte `wss://`-Verbindungen für Operator und Node verwenden dieselbe konfigurierte oder gespeicherte Zertifikatsrichtlinie. Bei vertrauenswürdigen `wss://*.ts.net`-Tailscale-Serve-Endpunkten werden veraltete gespeicherte Leaf-Pins nach der Zertifikatsrotation ersetzt und die Verbindung automatisch erneut versucht. Konfigurierte Pins werden nie automatisch rotiert; aktualisieren Sie `gateway.remote.tlsFingerprint`, nachdem Sie das neue Zertifikat geprüft haben, oder wechseln Sie zu **Remote over SSH**. |
| Sprachaktivierung                                       | Auslösephrasen werden im Remote-Modus automatisch weitergeleitet; ein separater Forwarder ist nicht erforderlich.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

## Benachrichtigungstöne

Wählen Sie mit `openclaw nodes notify` für jede Benachrichtigung einen Ton aus Skripten aus, zum Beispiel:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote-Gateway bereit" --sound Glass
```

In der App gibt es keinen globalen Schalter für einen Standardton; Aufrufer wählen pro Anfrage einen Ton (oder keinen).

## Verwandte Themen

- [macOS-App](/de/platforms/macos)
- [Remote-Zugriff](/de/gateway/remote)
