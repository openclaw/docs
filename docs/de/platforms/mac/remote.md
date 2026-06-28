---
read_when:
    - Remote-Mac-Steuerung einrichten oder debuggen
summary: macOS-App-Ablauf zur Steuerung eines entfernten OpenClaw-Gateways
title: Fernsteuerung
x-i18n:
    generated_at: "2026-06-28T00:12:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96ac4af5af9d3250f907818751120984106c3c7bcb1f3349d3f0678b4fefb120
    source_path: platforms/mac/remote.md
    workflow: 16
---

Dieser Ablauf ermöglicht der macOS-App, als vollständige Fernsteuerung für ein OpenClaw-Gateway zu dienen, das auf einem anderen Host (Desktop/Server) läuft. Die App kann sich direkt mit vertrauenswürdigen LAN-/Tailnet-Gateway-URLs verbinden oder einen SSH-Tunnel verwalten, wenn das Remote-Gateway nur über local loopback erreichbar ist. Health Checks, Voice-Wake-Weiterleitung und Web Chat verwenden dieselbe Remote-Konfiguration aus _Einstellungen → Allgemein_.

## Modi

- **Lokal (dieser Mac)**: Alles läuft auf dem Laptop. Kein SSH beteiligt.
- **Remote über SSH (Standard)**: OpenClaw-Befehle werden auf dem Remote-Host ausgeführt. Die Mac-App öffnet eine SSH-Verbindung mit `-o BatchMode` sowie Ihrer gewählten Identität/Ihrem gewählten Schlüssel und einer lokalen Portweiterleitung.
- **Direkt remote (ws/wss)**: Kein SSH-Tunnel. Die Mac-App verbindet sich direkt mit der Gateway-URL (zum Beispiel über LAN, Tailscale, Tailscale Serve oder einen öffentlichen HTTPS-Reverse-Proxy).

## Remote-Transporte

Der Remote-Modus unterstützt zwei Transporte:

- **SSH-Tunnel** (Standard): Verwendet `ssh -N -L ...`, um den Gateway-Port an localhost weiterzuleiten. Das Gateway sieht die IP des Nodes als `127.0.0.1`, weil der Tunnel über local loopback läuft.
- **Direkt (ws/wss)**: Verbindet sich direkt mit der Gateway-URL. Das Gateway sieht die echte Client-IP.

Im SSH-Tunnel-Modus werden erkannte LAN-/Tailnet-Hostnamen als
`gateway.remote.sshTarget` gespeichert. Die App behält `gateway.remote.url` auf dem lokalen
Tunnel-Endpunkt, zum Beispiel `ws://127.0.0.1:18789`, damit CLI, Web Chat und
der lokale Node-Host-Dienst alle denselben sicheren local loopback-Transport verwenden.
Wenn die Erkennung sowohl rohe Tailnet-IPs als auch stabile Hostnamen zurückgibt, bevorzugt die App
Tailscale MagicDNS- oder LAN-Namen, damit Remote-Verbindungen Adressänderungen besser überstehen.
Wenn der lokale Tunnel-Port vom Remote-Gateway-Port abweicht, setzen Sie
`gateway.remote.remotePort` auf den Port auf dem Remote-Host.

Browser-Automatisierung im Remote-Modus gehört dem CLI-Node-Host, nicht dem
nativen macOS-App-Node. Die App startet den installierten Node-Host-Dienst, wenn
möglich; wenn Sie Browser-Steuerung von diesem Mac benötigen, installieren/starten Sie ihn mit
`openclaw node install ...` und `openclaw node start` (oder führen Sie
`openclaw node run ...` im Vordergrund aus), und wählen Sie dann diesen browserfähigen
Node als Ziel.

## Voraussetzungen auf dem Remote-Host

1. Installieren Sie Node + pnpm und bauen/installieren Sie die OpenClaw-CLI (`pnpm install && pnpm build && pnpm link --global`).
2. Stellen Sie sicher, dass `openclaw` für nicht interaktive Shells im PATH ist (bei Bedarf per Symlink nach `/usr/local/bin` oder `/opt/homebrew/bin`).
3. Nur für SSH-Transport: Öffnen Sie SSH mit Schlüssel-Authentifizierung. Wir empfehlen **Tailscale**-IPs für stabile Erreichbarkeit außerhalb des LAN.

## Einrichtung der macOS-App

So konfigurieren Sie die App vor, ohne den Willkommensablauf zu verwenden:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Für ein Gateway, das bereits in einem vertrauenswürdigen LAN oder Tailnet erreichbar ist, überspringen Sie SSH vollständig:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Dies schreibt die Remote-Konfiguration, markiert das Onboarding als abgeschlossen und lässt die App
den ausgewählten Transport beim Start verwalten.

1. Öffnen Sie _Einstellungen → Allgemein_.
2. Wählen Sie unter **OpenClaw läuft** die Option **Remote** aus und setzen Sie:
   - **Transport**: **SSH-Tunnel** oder **Direkt (ws/wss)**.
   - **SSH-Ziel**: `user@host` (optional `:port`).
     - Wenn sich das Gateway im selben LAN befindet und Bonjour ankündigt, wählen Sie es aus der erkannten Liste aus, um dieses Feld automatisch auszufüllen.
   - **Gateway-URL** (nur Direkt): `wss://gateway.example.ts.net` (oder `ws://...` für lokal/LAN).
   - **Identitätsdatei** (erweitert): Pfad zu Ihrem Schlüssel.
   - **Projektwurzel** (erweitert): Remote-Checkout-Pfad, der für Befehle verwendet wird.
   - **CLI-Pfad** (erweitert): optionaler Pfad zu einem ausführbaren `openclaw`-Einstiegspunkt/Binary (wird automatisch ausgefüllt, wenn angekündigt).
3. Klicken Sie auf **Remote testen**. Erfolg bedeutet, dass das Remote-`openclaw status --json` korrekt läuft. Fehler bedeuten normalerweise PATH-/CLI-Probleme; Exit 127 bedeutet, dass die CLI remote nicht gefunden wird.
4. Health Checks und Web Chat laufen nun automatisch über den ausgewählten Transport.

## Web Chat

- **SSH-Tunnel**: Web Chat verbindet sich über den weitergeleiteten WebSocket-Steuerport mit dem Gateway (Standard 18789).
- **Direkt (ws/wss)**: Web Chat verbindet sich direkt mit der konfigurierten Gateway-URL.
- Es gibt keinen separaten WebChat-HTTP-Server mehr.

## Berechtigungen

- Der Remote-Host benötigt dieselben TCC-Genehmigungen wie lokal (Automatisierung, Bedienungshilfen, Bildschirmaufnahme, Mikrofon, Spracherkennung, Benachrichtigungen). Führen Sie das Onboarding auf diesem Rechner aus, um sie einmal zu erteilen.
- Nodes kündigen ihren Berechtigungsstatus über `node.list` / `node.describe` an, damit Agenten wissen, was verfügbar ist.

## Sicherheitshinweise

- Bevorzugen Sie local loopback-Bindings auf dem Remote-Host und verbinden Sie sich über SSH, Tailscale Serve oder eine vertrauenswürdige Tailnet-/LAN-Direkt-URL.
- SSH-Tunneling verwendet strikte Host-Key-Prüfung; vertrauen Sie zuerst dem Host-Key, damit er in `~/.ssh/known_hosts` vorhanden ist.
- Wenn Sie das Gateway an eine Schnittstelle binden, die nicht local loopback ist, verlangen Sie gültige Gateway-Authentifizierung: Token, Passwort oder einen identitätsbewussten Reverse-Proxy mit `gateway.auth.mode: "trusted-proxy"`.
- Siehe [Sicherheit](/de/gateway/security) und [Tailscale](/de/gateway/tailscale).

## WhatsApp-Anmeldeablauf (remote)

- Führen Sie `openclaw channels login --verbose` **auf dem Remote-Host** aus. Scannen Sie den QR-Code mit WhatsApp auf Ihrem Telefon.
- Führen Sie die Anmeldung auf diesem Host erneut aus, wenn die Authentifizierung abläuft. Der Health Check zeigt Verbindungsprobleme an.

## Fehlerbehebung

- **Exit 127 / nicht gefunden**: `openclaw` ist für Nicht-Login-Shells nicht im PATH. Fügen Sie es zu `/etc/paths` oder Ihrer Shell-rc hinzu, oder erstellen Sie einen Symlink nach `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health Probe fehlgeschlagen**: Prüfen Sie SSH-Erreichbarkeit, PATH und ob Baileys angemeldet ist (`openclaw status --json`).
- **Web Chat hängt**: Bestätigen Sie, dass das Gateway auf dem Remote-Host läuft und der weitergeleitete Port mit dem Gateway-WS-Port übereinstimmt; die UI benötigt eine fehlerfreie WS-Verbindung.
- **Node-IP zeigt 127.0.0.1**: Beim SSH-Tunnel erwartet. Stellen Sie **Transport** auf **Direkt (ws/wss)** um, wenn das Gateway die echte Client-IP sehen soll.
- **Dashboard funktioniert, aber Mac-Fähigkeiten sind offline**: Das bedeutet, dass die Operator-/Steuerverbindung der App fehlerfrei ist, die Companion-Node-Verbindung aber nicht verbunden ist oder ihre Befehlsoberfläche fehlt. Öffnen Sie den Gerätebereich in der Menüleiste und prüfen Sie, ob der Mac `paired · disconnected` ist. Für `wss://*.ts.net`-Tailscale-Serve-Endpunkte erkennt die App veraltete Legacy-TLS-Leaf-Pins nach einer Zertifikatsrotation, löscht den veralteten Pin, wenn macOS dem neuen Zertifikat vertraut, und versucht es automatisch erneut. Wenn das Zertifikat nicht systemweit vertrauenswürdig ist oder der Host kein Tailscale-Serve-Name ist, setzen Sie `gateway.remote.tlsFingerprint` auf den erwarteten Zertifikats-Fingerprint, prüfen Sie das Zertifikat oder wechseln Sie zu **Remote über SSH**.
- **Voice Wake**: Auslösephrasen werden im Remote-Modus automatisch weitergeleitet; kein separater Forwarder erforderlich.

## Benachrichtigungstöne

Wählen Sie Töne pro Benachrichtigung aus Skripten mit `openclaw` und `node.invoke`, z. B.:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Es gibt in der App keinen globalen Schalter „Standardton“ mehr; Aufrufer wählen pro Anfrage einen Ton (oder keinen).

## Verwandt

- [macOS-App](/de/platforms/macos)
- [Remote-Zugriff](/de/gateway/remote)
