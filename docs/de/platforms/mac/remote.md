---
read_when:
    - Remote-Mac-Steuerung einrichten oder debuggen
summary: macOS-App-Ablauf zum Steuern eines entfernten OpenClaw-Gateways
title: Fernsteuerung
x-i18n:
    generated_at: "2026-06-27T17:43:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3634785f797af55f7dc6d217e0116313e8ef7d314c503275fbc66b54eb29a69
    source_path: platforms/mac/remote.md
    workflow: 16
---

Dieser Ablauf ermöglicht der macOS-App, als vollständige Fernsteuerung für einen OpenClaw-Gateway zu fungieren, der auf einem anderen Host (Desktop/Server) läuft. Die App kann sich direkt mit vertrauenswürdigen LAN-/Tailnet-Gateway-URLs verbinden oder einen SSH-Tunnel verwalten, wenn der Remote-Gateway nur über local loopback erreichbar ist. Health Checks, Voice-Wake-Weiterleitung und Web-Chat verwenden dieselbe Remote-Konfiguration aus _Einstellungen → Allgemein_.

## Modi

- **Lokal (dieser Mac)**: Alles läuft auf dem Laptop. Kein SSH beteiligt.
- **Remote über SSH (Standard)**: OpenClaw-Befehle werden auf dem Remote-Host ausgeführt. Die Mac-App öffnet eine SSH-Verbindung mit `-o BatchMode` plus der von Ihnen gewählten Identität/dem Schlüssel und einer lokalen Portweiterleitung.
- **Remote direkt (ws/wss)**: Kein SSH-Tunnel. Die Mac-App verbindet sich direkt mit der Gateway-URL (zum Beispiel über LAN, Tailscale, Tailscale Serve oder einen öffentlichen HTTPS-Reverse-Proxy).

## Remote-Transporte

Der Remote-Modus unterstützt zwei Transporte:

- **SSH-Tunnel** (Standard): Verwendet `ssh -N -L ...`, um den Gateway-Port an localhost weiterzuleiten. Der Gateway sieht die IP des Node als `127.0.0.1`, weil der Tunnel local loopback verwendet.
- **Direkt (ws/wss)**: Verbindet sich direkt mit der Gateway-URL. Der Gateway sieht die echte Client-IP.

Im SSH-Tunnel-Modus werden erkannte LAN-/Tailnet-Hostnamen als
`gateway.remote.sshTarget` gespeichert. Die App hält `gateway.remote.url` auf dem lokalen
Tunnel-Endpunkt, zum Beispiel `ws://127.0.0.1:18789`, sodass CLI, Web-Chat und
der lokale Node-Host-Dienst alle denselben sicheren local-loopback-Transport verwenden.
Wenn sich der lokale Tunnel-Port vom Remote-Gateway-Port unterscheidet, setzen Sie
`gateway.remote.remotePort` auf den Port auf dem Remote-Host.

Browser-Automatisierung im Remote-Modus gehört dem CLI-Node-Host, nicht dem
nativen macOS-App-Node. Die App startet den installierten Node-Host-Dienst, wenn
möglich; wenn Sie Browser-Steuerung von diesem Mac benötigen, installieren/starten Sie ihn mit
`openclaw node install ...` und `openclaw node start` (oder führen Sie
`openclaw node run ...` im Vordergrund aus) und zielen Sie dann auf diesen browserfähigen
Node.

## Voraussetzungen auf dem Remote-Host

1. Installieren Sie Node + pnpm und bauen/installieren Sie die OpenClaw-CLI (`pnpm install && pnpm build && pnpm link --global`).
2. Stellen Sie sicher, dass `openclaw` für nicht interaktive Shells im PATH liegt (bei Bedarf Symlink nach `/usr/local/bin` oder `/opt/homebrew/bin`).
3. Nur für SSH-Transport: Öffnen Sie SSH mit Schlüssel-Authentifizierung. Wir empfehlen **Tailscale**-IPs für stabile Erreichbarkeit außerhalb des LAN.

## Einrichtung der macOS-App

Um die App ohne den Willkommensablauf vorzukonfigurieren:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Für einen Gateway, der bereits in einem vertrauenswürdigen LAN oder Tailnet erreichbar ist, überspringen Sie SSH vollständig:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Dies schreibt die Remote-Konfiguration, markiert das Onboarding als abgeschlossen und lässt die App
beim Start den ausgewählten Transport verwalten.

1. Öffnen Sie _Einstellungen → Allgemein_.
2. Wählen Sie unter **OpenClaw wird ausgeführt** die Option **Remote** und legen Sie fest:
   - **Transport**: **SSH-Tunnel** oder **Direkt (ws/wss)**.
   - **SSH-Ziel**: `user@host` (optional `:port`).
     - Wenn sich der Gateway im selben LAN befindet und Bonjour ankündigt, wählen Sie ihn aus der erkannten Liste aus, um dieses Feld automatisch auszufüllen.
   - **Gateway-URL** (nur Direkt): `wss://gateway.example.ts.net` (oder `ws://...` für lokal/LAN).
   - **Identitätsdatei** (erweitert): Pfad zu Ihrem Schlüssel.
   - **Projektstamm** (erweitert): Remote-Checkout-Pfad, der für Befehle verwendet wird.
   - **CLI-Pfad** (erweitert): Optionaler Pfad zu einem ausführbaren `openclaw`-Einstiegspunkt/Binary (wird automatisch ausgefüllt, wenn angekündigt).
3. Drücken Sie **Remote testen**. Erfolg bedeutet, dass das entfernte `openclaw status --json` korrekt läuft. Fehler bedeuten meistens PATH-/CLI-Probleme; Exit 127 bedeutet, dass die CLI auf dem Remote-Host nicht gefunden wird.
4. Health Checks und Web-Chat laufen nun automatisch über den ausgewählten Transport.

## Web-Chat

- **SSH-Tunnel**: Web-Chat verbindet sich mit dem Gateway über den weitergeleiteten WebSocket-Steuerport (Standard 18789).
- **Direkt (ws/wss)**: Web-Chat verbindet sich direkt mit der konfigurierten Gateway-URL.
- Es gibt keinen separaten WebChat-HTTP-Server mehr.

## Berechtigungen

- Der Remote-Host benötigt dieselben TCC-Freigaben wie lokal (Automation, Bedienungshilfen, Bildschirmaufnahme, Mikrofon, Spracherkennung, Mitteilungen). Führen Sie das Onboarding auf diesem Rechner aus, um sie einmalig zu gewähren.
- Nodes melden ihren Berechtigungsstatus über `node.list` / `node.describe`, damit Agenten wissen, was verfügbar ist.

## Sicherheitshinweise

- Bevorzugen Sie local-loopback-Bindings auf dem Remote-Host und verbinden Sie sich über SSH, Tailscale Serve oder eine vertrauenswürdige Tailnet-/LAN-Direkt-URL.
- SSH-Tunneling verwendet strikte Host-Key-Prüfung; vertrauen Sie zuerst dem Host-Key, damit er in `~/.ssh/known_hosts` vorhanden ist.
- Wenn Sie den Gateway an eine Nicht-local-loopback-Schnittstelle binden, verlangen Sie gültige Gateway-Authentifizierung: Token, Passwort oder einen identitätsbewussten Reverse-Proxy mit `gateway.auth.mode: "trusted-proxy"`.
- Siehe [Sicherheit](/de/gateway/security) und [Tailscale](/de/gateway/tailscale).

## WhatsApp-Anmeldeablauf (remote)

- Führen Sie `openclaw channels login --verbose` **auf dem Remote-Host** aus. Scannen Sie den QR-Code mit WhatsApp auf Ihrem Telefon.
- Führen Sie die Anmeldung auf diesem Host erneut aus, wenn die Authentifizierung abläuft. Der Health Check zeigt Verbindungsprobleme an.

## Fehlerbehebung

- **Exit 127 / nicht gefunden**: `openclaw` liegt für Nicht-Login-Shells nicht im PATH. Fügen Sie es zu `/etc/paths`, Ihrer Shell-RC hinzu oder erstellen Sie einen Symlink nach `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health-Probe fehlgeschlagen**: Prüfen Sie SSH-Erreichbarkeit, PATH und ob Baileys angemeldet ist (`openclaw status --json`).
- **Web-Chat hängt**: Bestätigen Sie, dass der Gateway auf dem Remote-Host läuft und der weitergeleitete Port mit dem Gateway-WS-Port übereinstimmt; die UI benötigt eine fehlerfreie WS-Verbindung.
- **Node-IP zeigt 127.0.0.1**: Beim SSH-Tunnel erwartet. Stellen Sie **Transport** auf **Direkt (ws/wss)** um, wenn der Gateway die echte Client-IP sehen soll.
- **Dashboard funktioniert, aber Mac-Fähigkeiten sind offline**: Das bedeutet, dass die Operator-/Steuerverbindung der App fehlerfrei ist, die Companion-Node-Verbindung jedoch nicht verbunden ist oder ihre Befehlsoberfläche fehlt. Öffnen Sie den Gerätebereich in der Menüleiste und prüfen Sie, ob der Mac `paired · disconnected` ist. Für `wss://*.ts.net`-Tailscale-Serve-Endpunkte erkennt die App veraltete Legacy-TLS-Leaf-Pins nach einer Zertifikatsrotation, löscht den veralteten Pin, wenn macOS dem neuen Zertifikat vertraut, und versucht es automatisch erneut. Wenn das Zertifikat nicht systemweit vertrauenswürdig ist oder der Host kein Tailscale-Serve-Name ist, setzen Sie `gateway.remote.tlsFingerprint` auf den erwarteten Zertifikatsfingerabdruck, prüfen Sie das Zertifikat oder wechseln Sie zu **Remote über SSH**.
- **Voice Wake**: Auslösephrasen werden im Remote-Modus automatisch weitergeleitet; kein separater Forwarder erforderlich.

## Benachrichtigungstöne

Wählen Sie Töne pro Benachrichtigung aus Skripten mit `openclaw` und `node.invoke`, z. B.:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Es gibt in der App keinen globalen Schalter für einen „Standardton“ mehr; Aufrufer wählen pro Anfrage einen Ton (oder keinen).

## Verwandt

- [macOS-App](/de/platforms/macos)
- [Remotezugriff](/de/gateway/remote)
