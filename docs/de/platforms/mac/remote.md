---
read_when:
    - Remote-mac-Steuerung einrichten oder debuggen
summary: macOS-App-Ablauf zum Steuern eines entfernten OpenClaw-Gateways über SSH
title: Remote-Steuerung
x-i18n:
    generated_at: "2026-04-26T11:34:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4de4980fe378fc9b685cf7732d21a80c640088191308b8ef1d3df9f468cb5be2
    source_path: platforms/mac/remote.md
    workflow: 15
---

# Entferntes OpenClaw (macOS ⇄ Remote-Host)

Dieser Ablauf ermöglicht es der macOS-App, als vollständige Fernsteuerung für ein OpenClaw-Gateway zu fungieren, das auf einem anderen Host (Desktop/Server) läuft. Es ist die Funktion **Remote over SSH** (Remote-Ausführung) der App. Alle Funktionen — Health Checks, Weiterleitung von Voice Wake und Web Chat — verwenden dieselbe entfernte SSH-Konfiguration aus _Settings → General_.

## Modi

- **Lokal (dieser Mac)**: Alles läuft auf dem Laptop. Kein SSH beteiligt.
- **Remote over SSH (Standard)**: OpenClaw-Befehle werden auf dem Remote-Host ausgeführt. Die mac-App öffnet eine SSH-Verbindung mit `-o BatchMode` plus Ihrer gewählten Identität/Ihrem gewählten Schlüssel und einer lokalen Port-Weiterleitung.
- **Remote direct (ws/wss)**: Kein SSH-Tunnel. Die mac-App verbindet sich direkt mit der Gateway-URL (zum Beispiel über Tailscale Serve oder einen öffentlichen HTTPS-Reverse-Proxy).

## Remote-Transporte

Der Remote-Modus unterstützt zwei Transporte:

- **SSH-Tunnel** (Standard): Verwendet `ssh -N -L ...`, um den Gateway-Port an localhost weiterzuleiten. Das Gateway sieht die IP des Node als `127.0.0.1`, weil der Tunnel local loopback ist.
- **Direkt (ws/wss)**: Verbindet sich direkt mit der Gateway-URL. Das Gateway sieht die echte Client-IP.

Im SSH-Tunnel-Modus werden erkannte LAN-/Tailnet-Hostnamen als
`gateway.remote.sshTarget` gespeichert. Die App hält `gateway.remote.url` auf dem lokalen
Tunnel-Endpunkt, zum Beispiel `ws://127.0.0.1:18789`, damit CLI, Web Chat und
der lokale Node-Host-Service alle denselben sicheren Loopback-Transport verwenden.

Browser-Automatisierung im Remote-Modus gehört dem CLI-Node-Host, nicht dem
nativen macOS-App-Node. Die App startet nach Möglichkeit den installierten Node-Host-Service; wenn Sie Browser-Steuerung von diesem Mac benötigen, installieren/starten Sie ihn mit
`openclaw node install ...` und `openclaw node start` (oder führen
`openclaw node run ...` im Vordergrund aus) und zielen Sie dann auf diesen browserfähigen
Node.

## Voraussetzungen auf dem Remote-Host

1. Installieren Sie Node + pnpm und bauen/installieren Sie die OpenClaw-CLI (`pnpm install && pnpm build && pnpm link --global`).
2. Stellen Sie sicher, dass `openclaw` für nicht interaktive Shells im PATH ist (bei Bedarf per Symlink nach `/usr/local/bin` oder `/opt/homebrew/bin`).
3. Aktivieren Sie SSH mit Schlüsselauthentifizierung. Wir empfehlen **Tailscale**-IPs für stabile Erreichbarkeit außerhalb des LAN.

## Einrichtung in der macOS-App

1. Öffnen Sie _Settings → General_.
2. Wählen Sie unter **OpenClaw runs** **Remote over SSH** und setzen Sie:
   - **Transport**: **SSH tunnel** oder **Direct (ws/wss)**.
   - **SSH target**: `user@host` (optional `:port`).
     - Wenn sich das Gateway im selben LAN befindet und Bonjour ankündigt, wählen Sie es aus der erkannten Liste aus, um dieses Feld automatisch zu füllen.
   - **Gateway URL** (nur Direct): `wss://gateway.example.ts.net` (oder `ws://...` für lokal/LAN).
   - **Identity file** (erweitert): Pfad zu Ihrem Schlüssel.
   - **Project root** (erweitert): Remote-Checkout-Pfad, der für Befehle verwendet wird.
   - **CLI path** (erweitert): optionaler Pfad zu einem ausführbaren `openclaw`-Entrypoint/Binary (wird automatisch ausgefüllt, wenn angekündigt).
3. Klicken Sie auf **Test remote**. Erfolg bedeutet, dass `openclaw status --json` auf dem Remote-Host korrekt ausgeführt wird. Fehler bedeuten meist PATH-/CLI-Probleme; Exit 127 bedeutet, dass die CLI remote nicht gefunden wird.
4. Health Checks und Web Chat laufen jetzt automatisch über diesen SSH-Tunnel.

## Web Chat

- **SSH-Tunnel**: Web Chat verbindet sich über den weitergeleiteten WebSocket-Control-Port (Standard 18789) mit dem Gateway.
- **Direkt (ws/wss)**: Web Chat verbindet sich direkt mit der konfigurierten Gateway-URL.
- Es gibt keinen separaten WebChat-HTTP-Server mehr.

## Berechtigungen

- Der Remote-Host benötigt dieselben TCC-Freigaben wie lokal (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Führen Sie das Onboarding auf dieser Maschine aus, um sie einmalig zu erteilen.
- Nodes kündigen ihren Berechtigungsstatus über `node.list` / `node.describe` an, damit Agenten wissen, was verfügbar ist.

## Sicherheitshinweise

- Bevorzugen Sie Loopback-Binds auf dem Remote-Host und verbinden Sie sich über SSH oder Tailscale.
- SSH-Tunneling verwendet strikte Host-Key-Prüfung; vertrauen Sie dem Host-Key zuerst, damit er in `~/.ssh/known_hosts` vorhanden ist.
- Wenn Sie das Gateway an eine Nicht-Loopback-Schnittstelle binden, verlangen Sie gültige Gateway-Authentifizierung: Token, Passwort oder einen identitätsbewussten Reverse-Proxy mit `gateway.auth.mode: "trusted-proxy"`.
- Siehe [Sicherheit](/de/gateway/security) und [Tailscale](/de/gateway/tailscale).

## WhatsApp-Login-Ablauf (remote)

- Führen Sie `openclaw channels login --verbose` **auf dem Remote-Host** aus. Scannen Sie den QR-Code mit WhatsApp auf Ihrem Telefon.
- Führen Sie den Login auf diesem Host erneut aus, wenn die Authentifizierung abläuft. Der Health Check zeigt Verbindungsprobleme an.

## Fehlerbehebung

- **exit 127 / not found**: `openclaw` ist für Nicht-Login-Shells nicht im PATH. Fügen Sie es zu `/etc/paths`, Ihrer Shell-RC hinzu oder erstellen Sie einen Symlink nach `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe failed**: Prüfen Sie SSH-Erreichbarkeit, PATH und ob Baileys angemeldet ist (`openclaw status --json`).
- **Web Chat hängt**: Bestätigen Sie, dass das Gateway auf dem Remote-Host läuft und dass der weitergeleitete Port dem Gateway-WS-Port entspricht; die UI erfordert eine gesunde WS-Verbindung.
- **Node-IP zeigt 127.0.0.1**: Im SSH-Tunnel erwartet. Wechseln Sie **Transport** auf **Direct (ws/wss)**, wenn das Gateway die echte Client-IP sehen soll.
- **Voice Wake**: Trigger-Phrasen werden im Remote-Modus automatisch weitergeleitet; ein separater Weiterleiter ist nicht erforderlich.

## Benachrichtigungstöne

Wählen Sie Töne pro Benachrichtigung aus Skripten mit `openclaw` und `node.invoke`, zum Beispiel:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Es gibt in der App keinen globalen Schalter für einen „Standardton“ mehr; Aufrufer wählen pro Anfrage einen Ton (oder keinen).

## Verwandt

- [macOS-App](/de/platforms/macos)
- [Remote-Zugriff](/de/gateway/remote)
