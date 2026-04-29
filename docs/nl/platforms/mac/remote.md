---
read_when:
    - Mac-bediening op afstand instellen of debuggen
summary: macOS-appflow voor het beheren van een externe OpenClaw Gateway via SSH
title: Besturing op afstand
x-i18n:
    generated_at: "2026-04-29T22:59:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4de4980fe378fc9b685cf7732d21a80c640088191308b8ef1d3df9f468cb5be2
    source_path: platforms/mac/remote.md
    workflow: 16
---

# Externe OpenClaw (macOS ⇄ externe host)

Met deze flow kan de macOS-app fungeren als volledige afstandsbediening voor een OpenClaw-Gateway die op een andere host (desktop/server) draait. Dit is de functie **Op afstand via SSH** (extern uitvoeren) van de app. Alle functies, zoals statuscontroles, doorsturen van Voice Wake en Web Chat, hergebruiken dezelfde externe SSH-configuratie uit _Instellingen → Algemeen_.

## Modi

- **Lokaal (deze Mac)**: Alles draait op de laptop. Geen SSH betrokken.
- **Op afstand via SSH (standaard)**: OpenClaw-opdrachten worden uitgevoerd op de externe host. De Mac-app opent een SSH-verbinding met `-o BatchMode` plus je gekozen identiteit/sleutel en een lokale poort-forward.
- **Direct op afstand (ws/wss)**: Geen SSH-tunnel. De Mac-app maakt rechtstreeks verbinding met de Gateway-URL (bijvoorbeeld via Tailscale Serve of een publieke HTTPS-reverseproxy).

## Externe transports

De externe modus ondersteunt twee transports:

- **SSH-tunnel** (standaard): Gebruikt `ssh -N -L ...` om de Gateway-poort door te sturen naar localhost. De Gateway ziet het IP-adres van de Node als `127.0.0.1`, omdat de tunnel loopback is.
- **Direct (ws/wss)**: Maakt rechtstreeks verbinding met de Gateway-URL. De Gateway ziet het echte client-IP-adres.

In SSH-tunnelmodus worden ontdekte LAN-/tailnet-hostnamen opgeslagen als
`gateway.remote.sshTarget`. De app houdt `gateway.remote.url` op het lokale
tunneleindpunt, bijvoorbeeld `ws://127.0.0.1:18789`, zodat CLI, Web Chat en
de lokale Node-hostservice allemaal hetzelfde veilige loopback-transport gebruiken.

Browserautomatisering in externe modus is eigendom van de CLI-Node-host, niet van de
native macOS-app-Node. De app start waar mogelijk de geïnstalleerde Node-hostservice;
als je browserbesturing vanaf die Mac nodig hebt, installeer/start die dan met
`openclaw node install ...` en `openclaw node start` (of voer
`openclaw node run ...` op de voorgrond uit) en richt je daarna op die browsergeschikte
Node.

## Vereisten op de externe host

1. Installeer Node + pnpm en bouw/installeer de OpenClaw CLI (`pnpm install && pnpm build && pnpm link --global`).
2. Zorg dat `openclaw` op PATH staat voor niet-interactieve shells (maak indien nodig een symlink naar `/usr/local/bin` of `/opt/homebrew/bin`).
3. Open SSH met sleutelauthenticatie. We raden **Tailscale**-IP-adressen aan voor stabiele bereikbaarheid buiten het LAN.

## macOS-app instellen

1. Open _Instellingen → Algemeen_.
2. Kies onder **OpenClaw draait** voor **Op afstand via SSH** en stel het volgende in:
   - **Transport**: **SSH-tunnel** of **Direct (ws/wss)**.
   - **SSH-doel**: `user@host` (optioneel `:port`).
     - Als de Gateway zich op hetzelfde LAN bevindt en Bonjour adverteert, kies deze dan uit de ontdekte lijst om dit veld automatisch in te vullen.
   - **Gateway-URL** (alleen Direct): `wss://gateway.example.ts.net` (of `ws://...` voor lokaal/LAN).
   - **Identiteitsbestand** (geavanceerd): pad naar je sleutel.
   - **Projectroot** (geavanceerd): extern checkoutpad dat voor opdrachten wordt gebruikt.
   - **CLI-pad** (geavanceerd): optioneel pad naar een uitvoerbaar `openclaw`-entrypoint/-binary (automatisch ingevuld wanneer geadverteerd).
3. Klik op **Extern testen**. Succes betekent dat de externe `openclaw status --json` correct wordt uitgevoerd. Fouten wijzen meestal op PATH-/CLI-problemen; exit 127 betekent dat de CLI extern niet wordt gevonden.
4. Statuscontroles en Web Chat lopen nu automatisch via deze SSH-tunnel.

## Web Chat

- **SSH-tunnel**: Web Chat maakt verbinding met de Gateway via de doorgestuurde WebSocket-besturingspoort (standaard 18789).
- **Direct (ws/wss)**: Web Chat maakt rechtstreeks verbinding met de geconfigureerde Gateway-URL.
- Er is geen aparte WebChat-HTTP-server meer.

## Machtigingen

- De externe host heeft dezelfde TCC-goedkeuringen nodig als lokaal (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Voer onboarding op die machine uit om ze eenmaal toe te kennen.
- Nodes adverteren hun machtigingsstatus via `node.list` / `node.describe`, zodat agents weten wat beschikbaar is.

## Beveiligingsopmerkingen

- Geef de voorkeur aan loopback-bindings op de externe host en maak verbinding via SSH of Tailscale.
- SSH-tunneling gebruikt strikte host-key-controle; vertrouw eerst de hostsleutel zodat deze in `~/.ssh/known_hosts` bestaat.
- Als je de Gateway aan een niet-loopback-interface bindt, vereis dan geldige Gateway-authenticatie: token, wachtwoord of een identity-aware reverseproxy met `gateway.auth.mode: "trusted-proxy"`.
- Zie [Beveiliging](/nl/gateway/security) en [Tailscale](/nl/gateway/tailscale).

## WhatsApp-inlogflow (extern)

- Voer `openclaw channels login --verbose` **op de externe host** uit. Scan de QR-code met WhatsApp op je telefoon.
- Voer het inloggen opnieuw uit op die host als de authenticatie verloopt. De statuscontrole toont koppelingsproblemen.

## Problemen oplossen

- **exit 127 / niet gevonden**: `openclaw` staat niet op PATH voor niet-login-shells. Voeg het toe aan `/etc/paths`, je shell-rc of maak een symlink naar `/usr/local/bin`/`/opt/homebrew/bin`.
- **Statusprobe mislukt**: controleer SSH-bereikbaarheid, PATH en of Baileys is ingelogd (`openclaw status --json`).
- **Web Chat blijft hangen**: bevestig dat de Gateway op de externe host draait en dat de doorgestuurde poort overeenkomt met de Gateway-WS-poort; de UI vereist een gezonde WS-verbinding.
- **Node-IP toont 127.0.0.1**: verwacht met de SSH-tunnel. Zet **Transport** op **Direct (ws/wss)** als je wilt dat de Gateway het echte client-IP-adres ziet.
- **Voice Wake**: triggerzinnen worden automatisch doorgestuurd in externe modus; er is geen aparte forwarder nodig.

## Meldingsgeluiden

Kies geluiden per melding vanuit scripts met `openclaw` en `node.invoke`, bijvoorbeeld:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Er is geen globale schakelaar voor “standaardgeluid” meer in de app; aanroepers kiezen per verzoek een geluid (of geen geluid).

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [Externe toegang](/nl/gateway/remote)
