---
read_when:
    - Instellen of debuggen van Mac-besturing op afstand
summary: macOS-appproces voor het beheren van een externe OpenClaw Gateway via SSH
title: Bediening op afstand
x-i18n:
    generated_at: "2026-04-30T11:21:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c63f752c3636a253220310c7c8e57a28549704b74b2f0370bac432bae28a7d3
    source_path: platforms/mac/remote.md
    workflow: 16
---

# Externe OpenClaw (macOS ⇄ externe host)

Met deze flow kan de macOS-app fungeren als volledige afstandsbediening voor een OpenClaw Gateway die op een andere host draait (desktop/server). Dit is de functie **Extern via SSH** (extern uitvoeren) van de app. Alle functies, zoals statuscontroles, doorsturen van Voice Wake en Web Chat, gebruiken dezelfde externe SSH-configuratie uit _Instellingen → Algemeen_.

## Modi

- **Lokaal (deze Mac)**: Alles draait op de laptop. Geen SSH betrokken.
- **Extern via SSH (standaard)**: OpenClaw-opdrachten worden uitgevoerd op de externe host. De Mac-app opent een SSH-verbinding met `-o BatchMode`, plus je gekozen identiteit/sleutel en een lokale port-forward.
- **Direct extern (ws/wss)**: Geen SSH-tunnel. De Mac-app maakt rechtstreeks verbinding met de Gateway-URL (bijvoorbeeld via Tailscale Serve of een openbare HTTPS-reverseproxy).

## Externe transports

De externe modus ondersteunt twee transports:

- **SSH-tunnel** (standaard): Gebruikt `ssh -N -L ...` om de Gateway-poort door te sturen naar localhost. De Gateway ziet het IP-adres van de Node als `127.0.0.1`, omdat de tunnel loopback is.
- **Direct (ws/wss)**: Maakt rechtstreeks verbinding met de Gateway-URL. De Gateway ziet het echte client-IP-adres.

In SSH-tunnelmodus worden ontdekte LAN-/tailnet-hostnamen opgeslagen als
`gateway.remote.sshTarget`. De app houdt `gateway.remote.url` op het lokale
tunneleindpunt, bijvoorbeeld `ws://127.0.0.1:18789`, zodat CLI, Web Chat en
de lokale Node-hostservice allemaal hetzelfde veilige loopback-transport gebruiken.

Browserautomatisering in externe modus is eigendom van de CLI-Node-host, niet van de
native macOS-app-Node. De app start waar mogelijk de geinstalleerde Node-hostservice;
als je browserbesturing vanaf die Mac nodig hebt, installeer/start die dan met
`openclaw node install ...` en `openclaw node start` (of voer
`openclaw node run ...` op de voorgrond uit) en richt je vervolgens op die browsergeschikte
Node.

## Vereisten op de externe host

1. Installeer Node + pnpm en bouw/installeer de OpenClaw CLI (`pnpm install && pnpm build && pnpm link --global`).
2. Zorg dat `openclaw` op PATH staat voor niet-interactieve shells (maak indien nodig een symlink naar `/usr/local/bin` of `/opt/homebrew/bin`).
3. Open SSH met sleutelauthenticatie. We raden **Tailscale**-IP-adressen aan voor stabiele bereikbaarheid buiten het LAN.

## macOS-app instellen

1. Open _Instellingen → Algemeen_.
2. Kies onder **OpenClaw draait** voor **Extern via SSH** en stel in:
   - **Transport**: **SSH-tunnel** of **Direct (ws/wss)**.
   - **SSH-doel**: `user@host` (optioneel `:port`).
     - Als de Gateway op hetzelfde LAN staat en Bonjour adverteert, kies die dan uit de ontdekte lijst om dit veld automatisch in te vullen.
   - **Gateway-URL** (alleen Direct): `wss://gateway.example.ts.net` (of `ws://...` voor lokaal/LAN).
   - **Identiteitsbestand** (geavanceerd): pad naar je sleutel.
   - **Projectroot** (geavanceerd): extern checkoutpad dat voor opdrachten wordt gebruikt.
   - **CLI-pad** (geavanceerd): optioneel pad naar een uitvoerbaar `openclaw`-entrypoint/binary (automatisch ingevuld wanneer geadverteerd).
3. Klik op **Externe verbinding testen**. Succes geeft aan dat de externe `openclaw status --json` correct draait. Fouten betekenen meestal PATH-/CLI-problemen; exit 127 betekent dat de CLI extern niet is gevonden.
4. Statuscontroles en Web Chat lopen nu automatisch via deze SSH-tunnel.

## Web Chat

- **SSH-tunnel**: Web Chat maakt verbinding met de Gateway via de doorgestuurde WebSocket-besturingspoort (standaard 18789).
- **Direct (ws/wss)**: Web Chat maakt rechtstreeks verbinding met de geconfigureerde Gateway-URL.
- Er is geen afzonderlijke WebChat-HTTP-server meer.

## Machtigingen

- De externe host heeft dezelfde TCC-goedkeuringen nodig als lokaal (Automatisering, Toegankelijkheid, Schermopname, Microfoon, Spraakherkenning, Meldingen). Voer onboarding uit op die machine om ze eenmalig toe te kennen.
- Nodes adverteren hun machtigingsstatus via `node.list` / `node.describe`, zodat agents weten wat beschikbaar is.

## Beveiligingsnotities

- Geef de voorkeur aan loopback-binds op de externe host en maak verbinding via SSH of Tailscale.
- SSH-tunneling gebruikt strikte host-sleutelcontrole; vertrouw eerst de host-sleutel zodat die in `~/.ssh/known_hosts` bestaat.
- Als je de Gateway aan een niet-loopback-interface bindt, vereis dan geldige Gateway-authenticatie: token, wachtwoord of een identiteitsbewuste reverseproxy met `gateway.auth.mode: "trusted-proxy"`.
- Zie [Beveiliging](/nl/gateway/security) en [Tailscale](/nl/gateway/tailscale).

## WhatsApp-inlogflow (extern)

- Voer `openclaw channels login --verbose` **op de externe host** uit. Scan de QR met WhatsApp op je telefoon.
- Voer login opnieuw uit op die host als authenticatie verloopt. De statuscontrole toont koppelingsproblemen.

## Probleemoplossing

- **exit 127 / niet gevonden**: `openclaw` staat niet op PATH voor niet-login-shells. Voeg het toe aan `/etc/paths`, je shell-rc, of maak een symlink naar `/usr/local/bin`/`/opt/homebrew/bin`.
- **Statusprobe mislukt**: controleer SSH-bereikbaarheid, PATH en of Baileys is ingelogd (`openclaw status --json`).
- **Web Chat loopt vast**: bevestig dat de Gateway op de externe host draait en dat de doorgestuurde poort overeenkomt met de Gateway-WS-poort; de UI vereist een gezonde WS-verbinding.
- **Node-IP toont 127.0.0.1**: verwacht bij de SSH-tunnel. Zet **Transport** op **Direct (ws/wss)** als je wilt dat de Gateway het echte client-IP-adres ziet.
- **Dashboard werkt maar Mac-mogelijkheden zijn offline**: dit betekent dat de operator-/besturingsverbinding van de app gezond is, maar dat de companion-Node-verbinding niet verbonden is of het opdrachtoppervlak mist. Open het apparaatoverzicht in de menubalk en controleer of de Mac `paired · disconnected` is. Voor `wss://*.ts.net` Tailscale Serve-eindpunten detecteert de app verouderde legacy TLS-leaf-pins na certificaatrotatie, wist de verouderde pin wanneer macOS het nieuwe certificaat vertrouwt en probeert het automatisch opnieuw. Als het certificaat niet door het systeem wordt vertrouwd of de host geen Tailscale Serve-naam is, controleer dan het certificaat of schakel over naar **Extern via SSH**.
- **Voice Wake**: triggerzinnen worden automatisch doorgestuurd in externe modus; er is geen afzonderlijke forwarder nodig.

## Meldingsgeluiden

Kies geluiden per melding vanuit scripts met `openclaw` en `node.invoke`, bijvoorbeeld:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Er is geen globale schakelaar voor “standaardgeluid” meer in de app; aanroepers kiezen per aanvraag een geluid (of geen geluid).

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [Externe toegang](/nl/gateway/remote)
