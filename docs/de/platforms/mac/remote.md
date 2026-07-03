---
read_when:
    - Remote-Mac-Steuerung einrichten oder debuggen
summary: macOS-App-Ablauf zur Steuerung eines entfernten OpenClaw-Gateways
title: Fernsteuerung
x-i18n:
    generated_at: "2026-07-03T23:30:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d1ac5065011ef16085b3349ee7224fe3e806a6de61feaac2dcd5c9ed264227e
    source_path: platforms/mac/remote.md
    workflow: 16
---

Dieser Ablauf ermöglicht der macOS-App, als vollständige Fernsteuerung für einen OpenClaw-Gateway zu agieren, der auf einem anderen Host (Desktop/Server) läuft. Die App kann sich direkt mit vertrauenswürdigen Gateway-URLs im LAN/Tailnet verbinden oder einen SSH-Tunnel verwalten, wenn der entfernte Gateway nur per Loopback erreichbar ist. Health Checks, Weiterleitung von Voice Wake und Web Chat verwenden dieselbe Remote-Konfiguration aus _Einstellungen → Allgemein_.

## Modi

- **Lokal (dieser Mac)**: Alles läuft auf dem Laptop. SSH ist nicht beteiligt.
- **Remote über SSH (Standard)**: OpenClaw-Befehle werden auf dem entfernten Host ausgeführt. Die Mac-App öffnet eine SSH-Verbindung mit `-o BatchMode` sowie Ihrer gewählten Identität/Ihrem gewählten Schlüssel und einer lokalen Port-Weiterleitung.
- **Direkt remote (ws/wss)**: Kein SSH-Tunnel. Die Mac-App verbindet sich direkt mit der Gateway-URL (zum Beispiel über LAN, Tailscale, Tailscale Serve oder einen öffentlichen HTTPS-Reverse-Proxy).

## Remote-Transporte

Der Remote-Modus unterstützt zwei Transporte:

- **SSH-Tunnel** (Standard): Verwendet `ssh -N -L ...`, um den Gateway-Port an localhost weiterzuleiten. Der Gateway sieht die IP des Node als `127.0.0.1`, weil der Tunnel per Loopback läuft.
- **Direkt (ws/wss)**: Verbindet sich direkt mit der Gateway-URL. Der Gateway sieht die echte Client-IP.

Die App deaktiviert SSH-Verbindungsmultiplexing und Hintergrundbetrieb nach der Authentifizierung für app-eigene SSH-Prozesse, damit sie den exakten Prozess überwachen und neu starten kann, selbst wenn der ausgewählte Alias `ControlMaster` oder `ForkAfterAuthentication` aktiviert.

Die SSH-Hostschlüsselprüfung ist standardmäßig strikt, weil Gateway-Anmeldeinformationen durch diesen Tunnel übertragen werden. Für einen verwalteten SSH-Alias, dessen Vertrauensverhalten Sie ausdrücklich verwenden möchten, aktivieren Sie dies mit `openclaw-mac configure-remote --ssh-target <alias> --ssh-host-key-policy openssh` oder setzen Sie `gateway.remote.sshHostKeyPolicy` auf `"openssh"`. Diese Opt-in-Einstellung verwendet die effektive OpenSSH-Hostschlüsselrichtlinie; prüfen Sie zuerst den Alias und alle passenden `Host *`- oder Systemkonfigurationen. Wenn Sie das SSH-Ziel in der App oder mit `configure-remote` ändern, wird die Richtlinie auf `strict` zurückgesetzt, sofern Sie sie nicht erneut ausdrücklich aktivieren.

Im SSH-Tunnelmodus werden erkannte LAN-/Tailnet-Hostnamen als
`gateway.remote.sshTarget` gespeichert. Die App belässt `gateway.remote.url` auf dem lokalen
Tunnel-Endpunkt, zum Beispiel `ws://127.0.0.1:18789`, sodass CLI, Web Chat und
der lokale Node-Host-Dienst denselben sicheren Loopback-Transport verwenden.
Wenn Discovery sowohl rohe Tailnet-IPs als auch stabile Hostnamen zurückgibt, bevorzugt die App
Tailscale MagicDNS- oder LAN-Namen, damit Remote-Verbindungen Adressänderungen
besser überstehen.
Wenn sich der lokale Tunnel-Port vom entfernten Gateway-Port unterscheidet, setzen Sie
`gateway.remote.remotePort` auf den Port auf dem entfernten Host.

Browserautomatisierung im Remote-Modus gehört zum CLI-Node-Host, nicht zum
nativen macOS-App-Node. Die App startet den installierten Node-Host-Dienst, wenn
möglich; wenn Sie Browsersteuerung von diesem Mac benötigen, installieren/starten Sie ihn mit
`openclaw node install ...` und `openclaw node start` (oder führen Sie
`openclaw node run ...` im Vordergrund aus), und zielen Sie dann auf diesen browserfähigen
Node.

## Voraussetzungen auf dem entfernten Host

1. Installieren Sie Node + pnpm und bauen/installieren Sie die OpenClaw-CLI (`pnpm install && pnpm build && pnpm link --global`).
2. Stellen Sie sicher, dass `openclaw` für nicht interaktive Shells im PATH liegt (bei Bedarf Symlink nach `/usr/local/bin` oder `/opt/homebrew/bin`).
3. Nur für SSH-Transport: Öffnen Sie SSH mit Schlüssel-Authentifizierung. Wir empfehlen **Tailscale**-IPs für stabile Erreichbarkeit außerhalb des LANs.

## Einrichtung der macOS-App

Um die App ohne Willkommensablauf vorzukonfigurieren:

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

Dies schreibt die Remote-Konfiguration, markiert das Onboarding als abgeschlossen und lässt die App beim Start den ausgewählten Transport verwalten.

1. Öffnen Sie _Einstellungen → Allgemein_.
2. Wählen Sie unter **OpenClaw läuft** **Remote** und legen Sie fest:
   - **Transport**: **SSH-Tunnel** oder **Direkt (ws/wss)**.
   - **SSH-Ziel**: `user@host` (optional `:port`).
     - Wenn sich der Gateway im selben LAN befindet und Bonjour ankündigt, wählen Sie ihn aus der erkannten Liste aus, um dieses Feld automatisch auszufüllen.
   - **Gateway-URL** (nur Direkt): `wss://gateway.example.ts.net` (oder `ws://...` für lokal/LAN).
   - **Identitätsdatei** (erweitert): Pfad zu Ihrem Schlüssel.
   - **Projektwurzel** (erweitert): entfernter Checkout-Pfad, der für Befehle verwendet wird.
   - **CLI-Pfad** (erweitert): optionaler Pfad zu einem ausführbaren `openclaw`-Einstiegspunkt/Binary (wird automatisch ausgefüllt, wenn angekündigt).
3. Drücken Sie **Remote testen**. Erfolg bedeutet, dass `openclaw status --json` auf dem entfernten Host korrekt ausgeführt wird. Fehler bedeuten meist PATH-/CLI-Probleme; Exit 127 bedeutet, dass die CLI auf dem entfernten Host nicht gefunden wird.
4. Health Checks und Web Chat laufen nun automatisch über den ausgewählten Transport.

## Web Chat

- **SSH-Tunnel**: Web Chat verbindet sich über den weitergeleiteten WebSocket-Steuerport mit dem Gateway (Standard 18789).
- **Direkt (ws/wss)**: Web Chat verbindet sich direkt mit der konfigurierten Gateway-URL.
- Es gibt keinen separaten WebChat-HTTP-Server mehr.

## Berechtigungen

- Der entfernte Host benötigt dieselben TCC-Genehmigungen wie lokal (Automation, Bedienungshilfen, Bildschirmaufnahme, Mikrofon, Spracherkennung, Mitteilungen). Führen Sie das Onboarding auf diesem Rechner aus, um sie einmal zu erteilen.
- Nodes geben ihren Berechtigungsstatus über `node.list` / `node.describe` bekannt, damit Agenten wissen, was verfügbar ist.

## Sicherheitshinweise

- Bevorzugen Sie Loopback-Bindings auf dem entfernten Host und verbinden Sie sich per SSH, Tailscale Serve oder über eine vertrauenswürdige direkte Tailnet-/LAN-URL.
- SSH-Tunneling erfordert standardmäßig einen bereits vertrauenswürdigen Hostschlüssel. Vertrauen Sie zuerst dem Hostschlüssel, damit er in der konfigurierten known-hosts-Datei vorhanden ist, oder wählen Sie ausdrücklich `gateway.remote.sshHostKeyPolicy: "openssh"` für einen verwalteten Alias, dessen OpenSSH-Vertrauensrichtlinie Sie akzeptieren.
- Wenn Sie den Gateway an eine Nicht-Loopback-Schnittstelle binden, verlangen Sie gültige Gateway-Authentifizierung: Token, Passwort oder einen identitätsbewussten Reverse-Proxy mit `gateway.auth.mode: "trusted-proxy"`.
- Siehe [Sicherheit](/de/gateway/security) und [Tailscale](/de/gateway/tailscale).

## WhatsApp-Anmeldeablauf (remote)

- Führen Sie `openclaw channels login --verbose` **auf dem entfernten Host** aus. Scannen Sie den QR-Code mit WhatsApp auf Ihrem Telefon.
- Führen Sie die Anmeldung auf diesem Host erneut aus, wenn die Authentifizierung abläuft. Der Health Check zeigt Verbindungsprobleme an.

## Fehlerbehebung

- **Exit 127 / nicht gefunden**: `openclaw` liegt für Nicht-Login-Shells nicht im PATH. Fügen Sie es zu `/etc/paths` oder Ihrer Shell-rc hinzu, oder erstellen Sie einen Symlink nach `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health Probe fehlgeschlagen**: Prüfen Sie SSH-Erreichbarkeit, PATH und ob Baileys angemeldet ist (`openclaw status --json`).
- **Web Chat hängt**: Bestätigen Sie, dass der Gateway auf dem entfernten Host läuft und der weitergeleitete Port dem Gateway-WS-Port entspricht; die UI benötigt eine funktionierende WS-Verbindung.
- **Node-IP zeigt 127.0.0.1**: Wird mit dem SSH-Tunnel erwartet. Wechseln Sie **Transport** zu **Direkt (ws/wss)**, wenn der Gateway die echte Client-IP sehen soll.
- **Dashboard funktioniert, aber Mac-Funktionen sind offline**: Das bedeutet, dass die Operator-/Steuerverbindung der App funktioniert, die Companion-Node-Verbindung aber nicht verbunden ist oder ihre Befehlsoberfläche fehlt. Öffnen Sie den Gerätebereich in der Menüleiste und prüfen Sie, ob der Mac `paired · disconnected` ist. Für `wss://*.ts.net`-Tailscale-Serve-Endpunkte erkennt die App veraltete Legacy-TLS-Leaf-Pins nach einer Zertifikatsrotation, entfernt den veralteten Pin, wenn macOS dem neuen Zertifikat vertraut, und versucht es automatisch erneut. Wenn das Zertifikat nicht systemweit vertrauenswürdig ist oder der Host kein Tailscale-Serve-Name ist, setzen Sie `gateway.remote.tlsFingerprint` auf den erwarteten Zertifikats-Fingerabdruck, prüfen Sie das Zertifikat oder wechseln Sie zu **Remote über SSH**.
- **Voice Wake**: Auslösephrasen werden im Remote-Modus automatisch weitergeleitet; kein separater Forwarder ist erforderlich.

## Benachrichtigungstöne

Wählen Sie Töne pro Benachrichtigung aus Skripten mit `openclaw` und `node.invoke`, z. B.:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Es gibt in der App keinen globalen Schalter für einen „Standardton“ mehr; Aufrufer wählen pro Anfrage einen Ton (oder keinen).

## Verwandt

- [macOS-App](/de/platforms/macos)
- [Remote-Zugriff](/de/gateway/remote)
