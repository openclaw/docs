---
read_when:
    - Remote Mac-bediening instellen of debuggen
summary: macOS-appflow voor het beheren van een externe OpenClaw-gateway
title: Bediening op afstand
x-i18n:
    generated_at: "2026-06-28T00:13:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96ac4af5af9d3250f907818751120984106c3c7bcb1f3349d3f0678b4fefb120
    source_path: platforms/mac/remote.md
    workflow: 16
---

Met deze flow kan de macOS-app fungeren als volledige afstandsbediening voor een OpenClaw-Gateway die op een andere host (desktop/server) draait. De app kan rechtstreeks verbinding maken met vertrouwde LAN-/Tailnet-Gateway-URL's of een SSH-tunnel beheren wanneer de externe Gateway alleen via loopback bereikbaar is. Health checks, doorsturen van Voice Wake en Web Chat gebruiken dezelfde externe configuratie uit _Settings → General_.

## Modi

- **Lokaal (deze Mac)**: Alles draait op de laptop. Geen SSH betrokken.
- **Extern via SSH (standaard)**: OpenClaw-opdrachten worden uitgevoerd op de externe host. De Mac-app opent een SSH-verbinding met `-o BatchMode`, plus je gekozen identity/key en een lokale port-forward.
- **Extern direct (ws/wss)**: Geen SSH-tunnel. De Mac-app maakt rechtstreeks verbinding met de Gateway-URL (bijvoorbeeld via LAN, Tailscale, Tailscale Serve of een openbare HTTPS-reverseproxy).

## Externe transporten

Externe modus ondersteunt twee transporten:

- **SSH-tunnel** (standaard): Gebruikt `ssh -N -L ...` om de Gateway-poort door te sturen naar localhost. De Gateway ziet het IP-adres van de node als `127.0.0.1`, omdat de tunnel loopback is.
- **Direct (ws/wss)**: Maakt rechtstreeks verbinding met de Gateway-URL. De Gateway ziet het echte client-IP-adres.

In SSH-tunnelmodus worden ontdekte LAN-/tailnet-hostnamen opgeslagen als
`gateway.remote.sshTarget`. De app houdt `gateway.remote.url` op het lokale
tunneleindpunt, bijvoorbeeld `ws://127.0.0.1:18789`, zodat CLI, Web Chat en
de lokale node-hostservice allemaal hetzelfde veilige loopback-transport gebruiken.
Wanneer discovery zowel ruwe Tailnet-IP's als stabiele hostnamen teruggeeft, geeft de app
de voorkeur aan Tailscale MagicDNS- of LAN-namen, zodat externe verbindingen adreswijzigingen
beter overleven.
Als de lokale tunnelpoort verschilt van de externe Gateway-poort, stel dan
`gateway.remote.remotePort` in op de poort op de externe host.

Browserautomatisering in externe modus is eigendom van de CLI-nodehost, niet van de
native macOS-app-node. De app start waar mogelijk de geïnstalleerde node-hostservice;
als je browserbesturing vanaf die Mac nodig hebt, installeer/start die dan met
`openclaw node install ...` en `openclaw node start` (of voer
`openclaw node run ...` op de voorgrond uit), en richt je vervolgens op die browsergeschikte
node.

## Vereisten op de externe host

1. Installeer Node + pnpm en bouw/installeer de OpenClaw-CLI (`pnpm install && pnpm build && pnpm link --global`).
2. Zorg dat `openclaw` op PATH staat voor niet-interactieve shells (symlink indien nodig naar `/usr/local/bin` of `/opt/homebrew/bin`).
3. Alleen voor SSH-transport: open SSH met key auth. We raden **Tailscale**-IP's aan voor stabiele bereikbaarheid buiten LAN.

## macOS-app instellen

Om de app vooraf te configureren zonder de welkomstflow:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Voor een Gateway die al bereikbaar is op een vertrouwd LAN of Tailnet, sla SSH volledig over:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Dit schrijft de externe configuratie, markeert onboarding als voltooid en laat de app
het geselecteerde transport beheren wanneer die start.

1. Open _Settings → General_.
2. Kies onder **OpenClaw runs** **Remote** en stel in:
   - **Transport**: **SSH tunnel** of **Direct (ws/wss)**.
   - **SSH target**: `user@host` (optioneel `:port`).
     - Als de Gateway op hetzelfde LAN staat en Bonjour adverteert, kies deze dan uit de ontdekte lijst om dit veld automatisch in te vullen.
   - **Gateway URL** (alleen Direct): `wss://gateway.example.ts.net` (of `ws://...` voor lokaal/LAN).
   - **Identity file** (geavanceerd): pad naar je key.
   - **Project root** (geavanceerd): extern checkoutpad dat voor opdrachten wordt gebruikt.
   - **CLI path** (geavanceerd): optioneel pad naar een uitvoerbaar `openclaw`-entrypoint/binary (automatisch ingevuld wanneer geadverteerd).
3. Druk op **Test remote**. Succes geeft aan dat de externe `openclaw status --json` correct draait. Fouten betekenen meestal PATH-/CLI-problemen; exit 127 betekent dat de CLI extern niet is gevonden.
4. Health checks en Web Chat lopen nu automatisch via het geselecteerde transport.

## Web Chat

- **SSH-tunnel**: Web Chat maakt verbinding met de Gateway via de doorgestuurde WebSocket-besturingspoort (standaard 18789).
- **Direct (ws/wss)**: Web Chat maakt rechtstreeks verbinding met de geconfigureerde Gateway-URL.
- Er is geen aparte WebChat-HTTP-server meer.

## Machtigingen

- De externe host heeft dezelfde TCC-goedkeuringen nodig als lokaal (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Voer onboarding uit op die machine om ze eenmalig toe te kennen.
- Nodes adverteren hun machtigingsstatus via `node.list` / `node.describe`, zodat agents weten wat beschikbaar is.

## Beveiligingsopmerkingen

- Geef de voorkeur aan loopback-binds op de externe host en maak verbinding via SSH, Tailscale Serve of een vertrouwde directe Tailnet-/LAN-URL.
- SSH-tunneling gebruikt strikte host-keycontrole; vertrouw eerst de host-key zodat deze bestaat in `~/.ssh/known_hosts`.
- Als je de Gateway aan een niet-loopback-interface bindt, vereis geldige Gateway-auth: token, wachtwoord of een identity-aware reverseproxy met `gateway.auth.mode: "trusted-proxy"`.
- Zie [Security](/nl/gateway/security) en [Tailscale](/nl/gateway/tailscale).

## WhatsApp-loginflow (extern)

- Voer `openclaw channels login --verbose` **op de externe host** uit. Scan de QR met WhatsApp op je telefoon.
- Voer login opnieuw uit op die host als auth verloopt. Health check zal koppelingsproblemen tonen.

## Probleemoplossing

- **exit 127 / not found**: `openclaw` staat niet op PATH voor niet-login-shells. Voeg het toe aan `/etc/paths`, je shell-rc, of symlink naar `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe failed**: controleer SSH-bereikbaarheid, PATH en of Baileys is ingelogd (`openclaw status --json`).
- **Web Chat stuck**: bevestig dat de Gateway op de externe host draait en dat de doorgestuurde poort overeenkomt met de Gateway-WS-poort; de UI vereist een gezonde WS-verbinding.
- **Node IP shows 127.0.0.1**: verwacht met de SSH-tunnel. Zet **Transport** op **Direct (ws/wss)** als je wilt dat de Gateway het echte client-IP-adres ziet.
- **Dashboard works but Mac capabilities are offline**: dit betekent dat de operator-/besturingsverbinding van de app gezond is, maar de companion-nodeverbinding niet verbonden is of het opdrachtoppervlak ontbreekt. Open het devicegedeelte in de menubalk en controleer of de Mac `paired · disconnected` is. Voor `wss://*.ts.net` Tailscale Serve-eindpunten detecteert de app verouderde legacy TLS-leaf-pins na certificaatrotatie, wist de verouderde pin wanneer macOS het nieuwe certificaat vertrouwt en probeert automatisch opnieuw. Als het certificaat niet door het systeem wordt vertrouwd of de host geen Tailscale Serve-naam is, stel dan `gateway.remote.tlsFingerprint` in op de verwachte certificaatvingerafdruk, controleer het certificaat of schakel over naar **Remote over SSH**.
- **Voice Wake**: triggerzinnen worden automatisch doorgestuurd in externe modus; er is geen aparte forwarder nodig.

## Meldingsgeluiden

Kies geluiden per melding vanuit scripts met `openclaw` en `node.invoke`, bijvoorbeeld:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Er is geen globale schakelaar voor "default sound" meer in de app; aanroepers kiezen per verzoek een geluid (of geen geluid).

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [Externe toegang](/nl/gateway/remote)
