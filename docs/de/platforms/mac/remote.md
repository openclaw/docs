---
read_when:
    - Remote-Mac-Steuerung einrichten oder Fehler beheben
summary: macOS-App-Ablauf zur Steuerung eines entfernten OpenClaw-Gateway über SSH
title: Fernsteuerung
x-i18n:
    generated_at: "2026-04-30T16:28:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c63f752c3636a253220310c7c8e57a28549704b74b2f0370bac432bae28a7d3
    source_path: platforms/mac/remote.md
    workflow: 16
---

# Remote OpenClaw (macOS ⇄ Remote-Host)

Dieser Ablauf lässt die macOS-App als vollständige Fernsteuerung für ein OpenClaw-Gateway dienen, das auf einem anderen Host (Desktop/Server) läuft. Es ist die Funktion **Remote über SSH** (Remote-Ausführung) der App. Alle Funktionen – Zustandsprüfungen, Voice-Wake-Weiterleitung und Webchat – verwenden dieselbe Remote-SSH-Konfiguration aus _Einstellungen → Allgemein_.

## Modi

- **Lokal (dieser Mac)**: Alles läuft auf dem Laptop. Kein SSH beteiligt.
- **Remote über SSH (Standard)**: OpenClaw-Befehle werden auf dem Remote-Host ausgeführt. Die Mac-App öffnet eine SSH-Verbindung mit `-o BatchMode` sowie Ihrer gewählten Identität/Ihrem Schlüssel und einer lokalen Portweiterleitung.
- **Direkt remote (ws/wss)**: Kein SSH-Tunnel. Die Mac-App verbindet sich direkt mit der Gateway-URL (zum Beispiel über Tailscale Serve oder einen öffentlichen HTTPS-Reverse-Proxy).

## Remote-Transporte

Der Remote-Modus unterstützt zwei Transporte:

- **SSH-Tunnel** (Standard): Verwendet `ssh -N -L ...`, um den Gateway-Port an localhost weiterzuleiten. Das Gateway sieht die IP des Nodes als `127.0.0.1`, weil der Tunnel loopback verwendet.
- **Direkt (ws/wss)**: Verbindet sich direkt mit der Gateway-URL. Das Gateway sieht die echte Client-IP.

Im SSH-Tunnelmodus werden erkannte LAN-/Tailnet-Hostnamen als
`gateway.remote.sshTarget` gespeichert. Die App behält `gateway.remote.url` auf dem lokalen
Tunnelendpunkt, zum Beispiel `ws://127.0.0.1:18789`, sodass CLI, Webchat und
der lokale Node-Host-Dienst alle denselben sicheren loopback-Transport verwenden.

Browserautomatisierung im Remote-Modus gehört zum CLI-Node-Host, nicht zum
nativen macOS-App-Node. Die App startet den installierten Node-Host-Dienst, wenn
möglich. Wenn Sie Browsersteuerung von diesem Mac benötigen, installieren/starten Sie sie mit
`openclaw node install ...` und `openclaw node start` (oder führen Sie
`openclaw node run ...` im Vordergrund aus) und wählen Sie dann diesen browserfähigen
Node als Ziel aus.

## Voraussetzungen auf dem Remote-Host

1. Installieren Sie Node + pnpm und bauen/installieren Sie die OpenClaw-CLI (`pnpm install && pnpm build && pnpm link --global`).
2. Stellen Sie sicher, dass `openclaw` für nicht-interaktive Shells im PATH ist (bei Bedarf Symlink nach `/usr/local/bin` oder `/opt/homebrew/bin`).
3. Öffnen Sie SSH mit Schlüsselauthentifizierung. Wir empfehlen **Tailscale**-IPs für stabile Erreichbarkeit außerhalb des LAN.

## Einrichtung der macOS-App

1. Öffnen Sie _Einstellungen → Allgemein_.
2. Wählen Sie unter **OpenClaw wird ausgeführt** die Option **Remote über SSH** und legen Sie Folgendes fest:
   - **Transport**: **SSH-Tunnel** oder **Direkt (ws/wss)**.
   - **SSH-Ziel**: `user@host` (optional `:port`).
     - Wenn sich das Gateway im selben LAN befindet und Bonjour ankündigt, wählen Sie es aus der erkannten Liste aus, um dieses Feld automatisch auszufüllen.
   - **Gateway-URL** (nur Direkt): `wss://gateway.example.ts.net` (oder `ws://...` für lokal/LAN).
   - **Identitätsdatei** (erweitert): Pfad zu Ihrem Schlüssel.
   - **Projektwurzel** (erweitert): Remote-Checkout-Pfad, der für Befehle verwendet wird.
   - **CLI-Pfad** (erweitert): optionaler Pfad zu einem ausführbaren `openclaw`-Einstiegspunkt/Binary (wird automatisch ausgefüllt, wenn angekündigt).
3. Klicken Sie auf **Remote testen**. Erfolg bedeutet, dass das Remote-`openclaw status --json` korrekt ausgeführt wird. Fehler bedeuten in der Regel PATH-/CLI-Probleme; Exit 127 bedeutet, dass die CLI remote nicht gefunden wird.
4. Zustandsprüfungen und Webchat laufen nun automatisch über diesen SSH-Tunnel.

## Webchat

- **SSH-Tunnel**: Webchat verbindet sich über den weitergeleiteten WebSocket-Steuerport (Standard 18789) mit dem Gateway.
- **Direkt (ws/wss)**: Webchat verbindet sich direkt mit der konfigurierten Gateway-URL.
- Es gibt keinen separaten WebChat-HTTP-Server mehr.

## Berechtigungen

- Der Remote-Host benötigt dieselben TCC-Freigaben wie lokal (Automation, Bedienungshilfen, Bildschirmaufnahme, Mikrofon, Spracherkennung, Mitteilungen). Führen Sie das Onboarding auf dieser Maschine aus, um sie einmalig zu gewähren.
- Nodes melden ihren Berechtigungsstatus über `node.list` / `node.describe`, damit Agenten wissen, was verfügbar ist.

## Sicherheitshinweise

- Bevorzugen Sie loopback-Binds auf dem Remote-Host und verbinden Sie sich über SSH oder Tailscale.
- SSH-Tunneling verwendet strikte Host-Key-Prüfung; vertrauen Sie zuerst dem Host-Schlüssel, damit er in `~/.ssh/known_hosts` vorhanden ist.
- Wenn Sie das Gateway an eine Nicht-loopback-Schnittstelle binden, verlangen Sie gültige Gateway-Authentifizierung: Token, Passwort oder einen identitätsbewussten Reverse-Proxy mit `gateway.auth.mode: "trusted-proxy"`.
- Siehe [Sicherheit](/de/gateway/security) und [Tailscale](/de/gateway/tailscale).

## WhatsApp-Anmeldeablauf (remote)

- Führen Sie `openclaw channels login --verbose` **auf dem Remote-Host** aus. Scannen Sie den QR-Code mit WhatsApp auf Ihrem Telefon.
- Führen Sie die Anmeldung auf diesem Host erneut aus, wenn die Authentifizierung abläuft. Die Zustandsprüfung zeigt Verbindungsprobleme an.

## Fehlerbehebung

- **exit 127 / nicht gefunden**: `openclaw` ist für Nicht-Login-Shells nicht im PATH. Fügen Sie es zu `/etc/paths` oder Ihrer Shell-rc hinzu oder erstellen Sie einen Symlink nach `/usr/local/bin`/`/opt/homebrew/bin`.
- **Zustandsprüfung fehlgeschlagen**: Prüfen Sie SSH-Erreichbarkeit, PATH und ob Baileys angemeldet ist (`openclaw status --json`).
- **Webchat hängt**: Bestätigen Sie, dass das Gateway auf dem Remote-Host läuft und der weitergeleitete Port mit dem Gateway-WS-Port übereinstimmt; die UI benötigt eine funktionsfähige WS-Verbindung.
- **Node-IP zeigt 127.0.0.1**: mit dem SSH-Tunnel erwartet. Stellen Sie **Transport** auf **Direkt (ws/wss)** um, wenn das Gateway die echte Client-IP sehen soll.
- **Dashboard funktioniert, aber Mac-Fähigkeiten sind offline**: Das bedeutet, dass die Operator-/Steuerverbindung der App funktionsfähig ist, die begleitende Node-Verbindung jedoch nicht verbunden ist oder ihre Befehlsoberfläche fehlt. Öffnen Sie den Gerätebereich in der Menüleiste und prüfen Sie, ob der Mac `paired · disconnected` ist. Für `wss://*.ts.net`-Tailscale-Serve-Endpunkte erkennt die App veraltete Legacy-TLS-Leaf-Pins nach Zertifikatsrotation, löscht den veralteten Pin, wenn macOS dem neuen Zertifikat vertraut, und versucht es automatisch erneut. Wenn dem Zertifikat systemweit nicht vertraut wird oder der Host kein Tailscale-Serve-Name ist, prüfen Sie das Zertifikat oder wechseln Sie zu **Remote über SSH**.
- **Voice Wake**: Auslösephrasen werden im Remote-Modus automatisch weitergeleitet; kein separater Weiterleiter ist nötig.

## Benachrichtigungstöne

Wählen Sie Töne pro Benachrichtigung aus Skripten mit `openclaw` und `node.invoke`, z. B.:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Es gibt in der App keinen globalen Schalter „Standardton“ mehr; Aufrufer wählen pro Anfrage einen Ton (oder keinen).

## Verwandte Themen

- [macOS-App](/de/platforms/macos)
- [Remote-Zugriff](/de/gateway/remote)
