---
read_when:
    - Einrichten oder Debuggen der Remote-Mac-Steuerung
summary: macOS-App-Ablauf zur Steuerung eines entfernten OpenClaw-Gateway über SSH
title: Fernsteuerung
x-i18n:
    generated_at: "2026-05-06T06:56:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: bd7eb110f4c3e6a52b4b9baeccce4ef9d02c01104c188940c28f245bc161894a
    source_path: platforms/mac/remote.md
    workflow: 16
---

Dieser Ablauf lässt die macOS-App als vollständige Fernsteuerung für einen OpenClaw Gateway agieren, der auf einem anderen Host (Desktop/Server) läuft. Es ist die Funktion **Remote über SSH** (Remote-Ausführung) der App. Alle Funktionen - Integritätsprüfungen, Weiterleitung von Voice Wake und Web Chat - verwenden dieselbe Remote-SSH-Konfiguration aus _Einstellungen → Allgemein_.

## Modi

- **Lokal (dieser Mac)**: Alles läuft auf dem Laptop. Kein SSH beteiligt.
- **Remote über SSH (Standard)**: OpenClaw-Befehle werden auf dem Remote-Host ausgeführt. Die Mac-App öffnet eine SSH-Verbindung mit `-o BatchMode` plus Ihrer gewählten Identität/Ihrem gewählten Schlüssel und einer lokalen Port-Weiterleitung.
- **Remote direkt (ws/wss)**: Kein SSH-Tunnel. Die Mac-App verbindet sich direkt mit der Gateway-URL (zum Beispiel über Tailscale Serve oder einen öffentlichen HTTPS-Reverse-Proxy).

## Remote-Transporte

Der Remote-Modus unterstützt zwei Transporte:

- **SSH-Tunnel** (Standard): Verwendet `ssh -N -L ...`, um den Gateway-Port an localhost weiterzuleiten. Der Gateway sieht die IP des Node als `127.0.0.1`, weil der Tunnel loopback ist.
- **Direkt (ws/wss)**: Verbindet sich direkt mit der Gateway-URL. Der Gateway sieht die echte Client-IP.

Im SSH-Tunnelmodus werden erkannte LAN-/Tailnet-Hostnamen als
`gateway.remote.sshTarget` gespeichert. Die App belässt `gateway.remote.url` auf dem lokalen
Tunnel-Endpunkt, zum Beispiel `ws://127.0.0.1:18789`, sodass CLI, Web Chat und
der lokale Node-Host-Service alle denselben sicheren loopback-Transport verwenden.

Browser-Automatisierung im Remote-Modus gehört dem CLI-Node-Host, nicht dem
nativen macOS-App-Node. Die App startet den installierten Node-Host-Service, wenn
möglich; wenn Sie Browser-Steuerung von diesem Mac benötigen, installieren/starten Sie ihn mit
`openclaw node install ...` und `openclaw node start` (oder führen Sie
`openclaw node run ...` im Vordergrund aus), und zielen Sie dann auf diesen browserfähigen
Node.

## Voraussetzungen auf dem Remote-Host

1. Installieren Sie Node + pnpm und bauen/installieren Sie die OpenClaw-CLI (`pnpm install && pnpm build && pnpm link --global`).
2. Stellen Sie sicher, dass `openclaw` für nicht-interaktive Shells im PATH liegt (bei Bedarf Symlink nach `/usr/local/bin` oder `/opt/homebrew/bin`).
3. Öffnen Sie SSH mit Schlüssel-Authentifizierung. Wir empfehlen **Tailscale**-IPs für stabile Erreichbarkeit außerhalb des LAN.

## Einrichtung der macOS-App

1. Öffnen Sie _Einstellungen → Allgemein_.
2. Wählen Sie unter **OpenClaw läuft** die Option **Remote über SSH** aus und legen Sie fest:
   - **Transport**: **SSH-Tunnel** oder **Direkt (ws/wss)**.
   - **SSH-Ziel**: `user@host` (optional `:port`).
     - Wenn sich der Gateway im selben LAN befindet und Bonjour ankündigt, wählen Sie ihn aus der erkannten Liste aus, um dieses Feld automatisch auszufüllen.
   - **Gateway-URL** (nur Direkt): `wss://gateway.example.ts.net` (oder `ws://...` für lokal/LAN).
   - **Identitätsdatei** (erweitert): Pfad zu Ihrem Schlüssel.
   - **Projektstamm** (erweitert): Remote-Checkout-Pfad, der für Befehle verwendet wird.
   - **CLI-Pfad** (erweitert): Optionaler Pfad zu einem ausführbaren `openclaw`-Einstiegspunkt/Binary (wird automatisch ausgefüllt, wenn angekündigt).
3. Klicken Sie auf **Remote testen**. Erfolg zeigt an, dass der Remote-Befehl `openclaw status --json` korrekt ausgeführt wird. Fehler bedeuten in der Regel PATH-/CLI-Probleme; Exit-Code 127 bedeutet, dass die CLI remote nicht gefunden wird.
4. Integritätsprüfungen und Web Chat laufen nun automatisch durch diesen SSH-Tunnel.

## Web Chat

- **SSH-Tunnel**: Web Chat verbindet sich über den weitergeleiteten WebSocket-Steuerport (Standard 18789) mit dem Gateway.
- **Direkt (ws/wss)**: Web Chat verbindet sich direkt mit der konfigurierten Gateway-URL.
- Es gibt keinen separaten WebChat-HTTP-Server mehr.

## Berechtigungen

- Der Remote-Host benötigt dieselben TCC-Freigaben wie lokal (Automation, Bedienungshilfen, Bildschirmaufnahme, Mikrofon, Spracherkennung, Mitteilungen). Führen Sie das Onboarding auf diesem Computer aus, um sie einmal zu gewähren.
- Nodes geben ihren Berechtigungsstatus über `node.list` / `node.describe` bekannt, damit Agents wissen, was verfügbar ist.

## Sicherheitshinweise

- Bevorzugen Sie loopback-Bindings auf dem Remote-Host und verbinden Sie sich über SSH oder Tailscale.
- SSH-Tunneling verwendet strikte Host-Key-Prüfung; vertrauen Sie zuerst dem Host-Key, damit er in `~/.ssh/known_hosts` existiert.
- Wenn Sie den Gateway an eine Nicht-loopback-Schnittstelle binden, verlangen Sie gültige Gateway-Authentifizierung: Token, Passwort oder einen identitätsbewussten Reverse-Proxy mit `gateway.auth.mode: "trusted-proxy"`.
- Siehe [Sicherheit](/de/gateway/security) und [Tailscale](/de/gateway/tailscale).

## WhatsApp-Anmeldeablauf (remote)

- Führen Sie `openclaw channels login --verbose` **auf dem Remote-Host** aus. Scannen Sie den QR-Code mit WhatsApp auf Ihrem Telefon.
- Führen Sie die Anmeldung auf diesem Host erneut aus, wenn die Authentifizierung abläuft. Die Integritätsprüfung zeigt Verbindungsprobleme an.

## Fehlerbehebung

- **Exit 127 / nicht gefunden**: `openclaw` liegt für Nicht-Login-Shells nicht im PATH. Fügen Sie es zu `/etc/paths`, Ihrer Shell-RC hinzu, oder symlinken Sie es nach `/usr/local/bin`/`/opt/homebrew/bin`.
- **Integritätsprobe fehlgeschlagen**: Prüfen Sie SSH-Erreichbarkeit, PATH und ob Baileys angemeldet ist (`openclaw status --json`).
- **Web Chat hängt**: Bestätigen Sie, dass der Gateway auf dem Remote-Host läuft und der weitergeleitete Port dem Gateway-WS-Port entspricht; die UI benötigt eine fehlerfreie WS-Verbindung.
- **Node-IP zeigt 127.0.0.1**: Beim SSH-Tunnel erwartet. Wechseln Sie **Transport** zu **Direkt (ws/wss)**, wenn der Gateway die echte Client-IP sehen soll.
- **Dashboard funktioniert, aber Mac-Fähigkeiten sind offline**: Das bedeutet, dass die Operator-/Steuerverbindung der App fehlerfrei ist, aber die Companion-Node-Verbindung nicht verbunden ist oder ihre Befehlsoberfläche fehlt. Öffnen Sie den Gerätebereich in der Menüleiste und prüfen Sie, ob der Mac `paired · disconnected` ist. Für `wss://*.ts.net`-Tailscale-Serve-Endpunkte erkennt die App veraltete Legacy-TLS-Leaf-Pins nach Zertifikatsrotation, löscht den veralteten Pin, wenn macOS dem neuen Zertifikat vertraut, und versucht es automatisch erneut. Wenn das Zertifikat vom System nicht als vertrauenswürdig eingestuft wird oder der Host kein Tailscale-Serve-Name ist, prüfen Sie das Zertifikat oder wechseln Sie zu **Remote über SSH**.
- **Voice Wake**: Trigger-Phrasen werden im Remote-Modus automatisch weitergeleitet; kein separater Forwarder ist erforderlich.

## Benachrichtigungstöne

Wählen Sie Töne pro Benachrichtigung aus Skripten mit `openclaw` und `node.invoke`, z. B.:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Es gibt in der App keinen globalen Schalter für den „Standardton“ mehr; Aufrufer wählen pro Anfrage einen Ton (oder keinen).

## Verwandt

- [macOS-App](/de/platforms/macos)
- [Remote-Zugriff](/de/gateway/remote)
