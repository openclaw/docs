---
read_when:
    - Extern Mac-beheer instellen of debuggen
summary: macOS-appstroom voor het bedienen van een externe OpenClaw-gateway
title: Bediening op afstand
x-i18n:
    generated_at: "2026-06-27T17:48:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3634785f797af55f7dc6d217e0116313e8ef7d314c503275fbc66b54eb29a69
    source_path: platforms/mac/remote.md
    workflow: 16
---

Deze flow laat de macOS-app fungeren als volledige afstandsbediening voor een OpenClaw-Gateway die op een andere host (desktop/server) draait. De app kan direct verbinding maken met vertrouwde LAN-/Tailnet-Gateway-URL's of een SSH-tunnel beheren wanneer de externe Gateway alleen via loopback beschikbaar is. Gezondheidscontroles, doorsturen van Voice Wake en Web Chat hergebruiken dezelfde externe configuratie uit _Instellingen → Algemeen_.

## Modi

- **Lokaal (deze Mac)**: Alles draait op de laptop. Geen SSH betrokken.
- **Extern via SSH (standaard)**: OpenClaw-opdrachten worden uitgevoerd op de externe host. De Mac-app opent een SSH-verbinding met `-o BatchMode` plus je gekozen identiteit/sleutel en een lokale port-forward.
- **Extern direct (ws/wss)**: Geen SSH-tunnel. De Mac-app maakt rechtstreeks verbinding met de Gateway-URL (bijvoorbeeld via LAN, Tailscale, Tailscale Serve of een openbare HTTPS-reverseproxy).

## Externe transporten

Externe modus ondersteunt twee transporten:

- **SSH-tunnel** (standaard): Gebruikt `ssh -N -L ...` om de Gateway-poort door te sturen naar localhost. De Gateway ziet het IP-adres van de Node als `127.0.0.1` omdat de tunnel loopback is.
- **Direct (ws/wss)**: Maakt rechtstreeks verbinding met de Gateway-URL. De Gateway ziet het echte client-IP.

In SSH-tunnelmodus worden ontdekte LAN-/tailnet-hostnamen opgeslagen als
`gateway.remote.sshTarget`. De app houdt `gateway.remote.url` op het lokale
tunneleindpunt, bijvoorbeeld `ws://127.0.0.1:18789`, zodat CLI, Web Chat en
de lokale node-host-service allemaal hetzelfde veilige loopback-transport gebruiken.
Als de lokale tunnelpoort verschilt van de externe Gateway-poort, stel dan
`gateway.remote.remotePort` in op de poort op de externe host.

Browserautomatisering in externe modus is eigendom van de CLI-nodehost, niet van de
native macOS-appnode. De app start waar mogelijk de geïnstalleerde nodehostservice;
als je browserbesturing vanaf die Mac nodig hebt, installeer/start die dan met
`openclaw node install ...` en `openclaw node start` (of voer
`openclaw node run ...` op de voorgrond uit), en richt je daarna op die browsergeschikte
Node.

## Vereisten op de externe host

1. Installeer Node + pnpm en bouw/installeer de OpenClaw-CLI (`pnpm install && pnpm build && pnpm link --global`).
2. Zorg dat `openclaw` op PATH staat voor niet-interactieve shells (maak indien nodig een symlink naar `/usr/local/bin` of `/opt/homebrew/bin`).
3. Alleen voor SSH-transport: open SSH met sleutelauthenticatie. We raden **Tailscale**-IP's aan voor stabiele bereikbaarheid buiten het LAN.

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

Dit schrijft de externe configuratie weg, markeert onboarding als voltooid en laat de app
het geselecteerde transport beheren wanneer deze start.

1. Open _Instellingen → Algemeen_.
2. Kies onder **OpenClaw draait** **Extern** en stel in:
   - **Transport**: **SSH-tunnel** of **Direct (ws/wss)**.
   - **SSH-doel**: `user@host` (optioneel `:port`).
     - Als de Gateway op hetzelfde LAN zit en Bonjour adverteert, kies deze dan uit de ontdekte lijst om dit veld automatisch in te vullen.
   - **Gateway-URL** (alleen Direct): `wss://gateway.example.ts.net` (of `ws://...` voor lokaal/LAN).
   - **Identiteitsbestand** (geavanceerd): pad naar je sleutel.
   - **Projectroot** (geavanceerd): extern checkoutpad dat voor opdrachten wordt gebruikt.
   - **CLI-pad** (geavanceerd): optioneel pad naar een uitvoerbaar `openclaw`-entrypoint/binary (automatisch ingevuld wanneer geadverteerd).
3. Druk op **Externe verbinding testen**. Succes betekent dat de externe `openclaw status --json` correct wordt uitgevoerd. Fouten betekenen meestal PATH-/CLI-problemen; exitcode 127 betekent dat de CLI extern niet wordt gevonden.
4. Gezondheidscontroles en Web Chat lopen nu automatisch via het geselecteerde transport.

## Web Chat

- **SSH-tunnel**: Web Chat maakt verbinding met de Gateway via de doorgestuurde WebSocket-controlpoort (standaard 18789).
- **Direct (ws/wss)**: Web Chat maakt rechtstreeks verbinding met de geconfigureerde Gateway-URL.
- Er is geen aparte WebChat-HTTP-server meer.

## Machtigingen

- De externe host heeft dezelfde TCC-goedkeuringen nodig als lokaal (Automatisering, Toegankelijkheid, Schermopname, Microfoon, Spraakherkenning, Meldingen). Voer onboarding op die machine uit om ze eenmalig te verlenen.
- Nodes adverteren hun machtigingsstatus via `node.list` / `node.describe`, zodat agents weten wat beschikbaar is.

## Beveiligingsnotities

- Geef de voorkeur aan loopback-bindings op de externe host en maak verbinding via SSH, Tailscale Serve of een vertrouwde directe Tailnet-/LAN-URL.
- SSH-tunneling gebruikt strikte host-keycontrole; vertrouw eerst de hostsleutel zodat deze in `~/.ssh/known_hosts` bestaat.
- Als je de Gateway aan een niet-loopback-interface bindt, vereis dan geldige Gateway-authenticatie: token, wachtwoord of een identity-aware reverseproxy met `gateway.auth.mode: "trusted-proxy"`.
- Zie [Beveiliging](/nl/gateway/security) en [Tailscale](/nl/gateway/tailscale).

## WhatsApp-aanmeldflow (extern)

- Voer `openclaw channels login --verbose` **op de externe host** uit. Scan de QR-code met WhatsApp op je telefoon.
- Voer login opnieuw uit op die host als de authenticatie verloopt. De gezondheidscontrole toont koppelingsproblemen.

## Probleemoplossing

- **exit 127 / niet gevonden**: `openclaw` staat niet op PATH voor niet-login-shells. Voeg het toe aan `/etc/paths`, je shell-rc, of maak een symlink naar `/usr/local/bin`/`/opt/homebrew/bin`.
- **Gezondheidsprobe mislukt**: controleer SSH-bereikbaarheid, PATH, en of Baileys is aangemeld (`openclaw status --json`).
- **Web Chat blijft hangen**: bevestig dat de Gateway op de externe host draait en dat de doorgestuurde poort overeenkomt met de Gateway-WS-poort; de UI vereist een gezonde WS-verbinding.
- **Node-IP toont 127.0.0.1**: verwacht bij de SSH-tunnel. Zet **Transport** op **Direct (ws/wss)** als je wilt dat de Gateway het echte client-IP ziet.
- **Dashboard werkt maar Mac-mogelijkheden zijn offline**: dit betekent dat de operator-/controlverbinding van de app gezond is, maar dat de bijbehorende Node-verbinding niet verbonden is of zijn opdrachtoppervlak mist. Open het apparaatgedeelte in de menubalk en controleer of de Mac `paired · disconnected` is. Voor `wss://*.ts.net` Tailscale Serve-eindpunten detecteert de app verouderde legacy TLS-leaf-pins na certificaatrotatie, wist de verouderde pin wanneer macOS het nieuwe certificaat vertrouwt, en probeert automatisch opnieuw. Als het certificaat niet door het systeem wordt vertrouwd of de host geen Tailscale Serve-naam is, stel dan `gateway.remote.tlsFingerprint` in op de verwachte certificaatfingerprint, controleer het certificaat, of schakel over naar **Extern via SSH**.
- **Voice Wake**: triggerzinnen worden automatisch doorgestuurd in externe modus; er is geen aparte forwarder nodig.

## Meldingsgeluiden

Kies geluiden per melding vanuit scripts met `openclaw` en `node.invoke`, bijvoorbeeld:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Er is geen globale schakelaar voor "standaardgeluid" meer in de app; callers kiezen per aanvraag een geluid (of geen geluid).

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [Externe toegang](/nl/gateway/remote)
