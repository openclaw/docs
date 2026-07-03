---
read_when:
    - Externe Mac-bediening instellen of debuggen
summary: macOS-appstroom voor het beheren van een externe OpenClaw-gateway
title: Bediening op afstand
x-i18n:
    generated_at: "2026-07-03T23:37:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d1ac5065011ef16085b3349ee7224fe3e806a6de61feaac2dcd5c9ed264227e
    source_path: platforms/mac/remote.md
    workflow: 16
---

Met deze flow kan de macOS-app fungeren als volledige afstandsbediening voor een OpenClaw-gateway die op een andere host draait (desktop/server). De app kan rechtstreeks verbinding maken met vertrouwde LAN-/Tailnet-gateway-URL's of een SSH-tunnel beheren wanneer de externe gateway alleen via loopback bereikbaar is. Health checks, Voice Wake-doorsturing en Web Chat gebruiken dezelfde externe configuratie uit _Instellingen → Algemeen_.

## Modi

- **Lokaal (deze Mac)**: Alles draait op de laptop. Geen SSH betrokken.
- **Extern via SSH (standaard)**: OpenClaw-opdrachten worden uitgevoerd op de externe host. De Mac-app opent een SSH-verbinding met `-o BatchMode` plus je gekozen identiteit/sleutel en een lokale poortdoorsturing.
- **Extern direct (ws/wss)**: Geen SSH-tunnel. De Mac-app maakt rechtstreeks verbinding met de gateway-URL (bijvoorbeeld via LAN, Tailscale, Tailscale Serve of een openbare HTTPS-reverseproxy).

## Externe transporten

Externe modus ondersteunt twee transporten:

- **SSH-tunnel** (standaard): Gebruikt `ssh -N -L ...` om de gateway-poort door te sturen naar localhost. De gateway ziet het IP-adres van de node als `127.0.0.1`, omdat de tunnel loopback is.
- **Direct (ws/wss)**: Maakt rechtstreeks verbinding met de gateway-URL. De gateway ziet het echte client-IP-adres.

De app schakelt SSH-connection multiplexing en post-authentication backgrounding uit voor SSH-processen die eigendom zijn van de app, zodat hij het exacte proces kan bewaken en herstarten, zelfs wanneer de geselecteerde alias `ControlMaster` of `ForkAfterAuthentication` inschakelt.

SSH-hostsleutelverificatie is standaard strikt, omdat gateway-inloggegevens via deze tunnel lopen. Voor een beheerde SSH-alias waarvan je het vertrouwensgedrag expliciet wilt gebruiken, schakel je dit in met `openclaw-mac configure-remote --ssh-target <alias> --ssh-host-key-policy openssh` of stel je `gateway.remote.sshHostKeyPolicy` in op `"openssh"`. Deze expliciete keuze gebruikt het effectieve OpenSSH-hostsleutelbeleid; controleer eerst de alias en eventuele overeenkomende `Host *`- of systeemconfiguratie. Als je het SSH-doel in de app of met `configure-remote` wijzigt, wordt het beleid teruggezet naar `strict`, tenzij je opnieuw expliciet inschakelt.

In SSH-tunnelmodus worden ontdekte LAN-/tailnet-hostnamen opgeslagen als
`gateway.remote.sshTarget`. De app houdt `gateway.remote.url` op het lokale
tunneleindpunt, bijvoorbeeld `ws://127.0.0.1:18789`, zodat CLI, Web Chat en
de lokale node-hostservice allemaal hetzelfde veilige loopback-transport gebruiken.
Wanneer ontdekking zowel ruwe Tailnet-IP's als stabiele hostnamen retourneert, geeft de app
de voorkeur aan Tailscale MagicDNS- of LAN-namen, zodat externe verbindingen beter bestand zijn
tegen adreswijzigingen.
Als de lokale tunnelpoort verschilt van de externe gateway-poort, stel dan
`gateway.remote.remotePort` in op de poort op de externe host.

Browserautomatisering in externe modus is eigendom van de CLI-nodehost, niet van de
native macOS-appnode. De app start waar mogelijk de geïnstalleerde nodehostservice;
als je browserbesturing vanaf die Mac nodig hebt, installeer/start die dan met
`openclaw node install ...` en `openclaw node start` (of voer
`openclaw node run ...` op de voorgrond uit) en richt je daarna op die browsergeschikte
node.

## Vereisten op de externe host

1. Installeer Node + pnpm en bouw/installeer de OpenClaw CLI (`pnpm install && pnpm build && pnpm link --global`).
2. Zorg dat `openclaw` op PATH staat voor niet-interactieve shells (maak zo nodig een symlink naar `/usr/local/bin` of `/opt/homebrew/bin`).
3. Alleen voor SSH-transport: open SSH met sleutelverificatie. We raden **Tailscale**-IP's aan voor stabiele bereikbaarheid buiten het LAN.

## macOS-app instellen

Om de app vooraf te configureren zonder de welkomstflow:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Voor een gateway die al bereikbaar is op een vertrouwd LAN of Tailnet, sla je SSH volledig over:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Dit schrijft de externe configuratie, markeert onboarding als voltooid en laat de app
het geselecteerde transport beheren wanneer hij start.

1. Open _Instellingen → Algemeen_.
2. Kies onder **OpenClaw draait** voor **Extern** en stel in:
   - **Transport**: **SSH-tunnel** of **Direct (ws/wss)**.
   - **SSH-doel**: `user@host` (optioneel `:port`).
     - Als de gateway zich op hetzelfde LAN bevindt en Bonjour adverteert, kies hem dan uit de ontdekte lijst om dit veld automatisch in te vullen.
   - **Gateway-URL** (alleen Direct): `wss://gateway.example.ts.net` (of `ws://...` voor lokaal/LAN).
   - **Identiteitsbestand** (geavanceerd): pad naar je sleutel.
   - **Projectroot** (geavanceerd): extern checkoutpad dat voor opdrachten wordt gebruikt.
   - **CLI-pad** (geavanceerd): optioneel pad naar een uitvoerbaar `openclaw`-entrypoint/binary (automatisch ingevuld wanneer geadverteerd).
3. Klik op **Extern testen**. Succes betekent dat de externe `openclaw status --json` correct draait. Fouten betekenen meestal PATH-/CLI-problemen; exit 127 betekent dat de CLI extern niet is gevonden.
4. Health checks en Web Chat lopen nu automatisch via het geselecteerde transport.

## Web Chat

- **SSH-tunnel**: Web Chat maakt verbinding met de gateway via de doorgestuurde WebSocket-besturingspoort (standaard 18789).
- **Direct (ws/wss)**: Web Chat maakt rechtstreeks verbinding met de geconfigureerde gateway-URL.
- Er is geen aparte WebChat-HTTP-server meer.

## Machtigingen

- De externe host heeft dezelfde TCC-goedkeuringen nodig als lokaal (Automatisering, Toegankelijkheid, Schermopname, Microfoon, Spraakherkenning, Meldingen). Voer onboarding op die machine uit om ze eenmalig toe te kennen.
- Nodes adverteren hun machtigingsstatus via `node.list` / `node.describe`, zodat agents weten wat beschikbaar is.

## Beveiligingsopmerkingen

- Geef de voorkeur aan loopback-binds op de externe host en maak verbinding via SSH, Tailscale Serve of een vertrouwde Tailnet-/LAN-directe URL.
- SSH-tunneling vereist standaard een reeds vertrouwde hostsleutel. Vertrouw eerst de hostsleutel zodat die bestaat in het geconfigureerde known-hosts-bestand, of kies expliciet `gateway.remote.sshHostKeyPolicy: "openssh"` voor een beheerde alias waarvan je het OpenSSH-vertrouwensbeleid accepteert.
- Als je de Gateway bindt aan een niet-loopback-interface, vereis dan geldige Gateway-authenticatie: token, wachtwoord of een identiteitsbewuste reverseproxy met `gateway.auth.mode: "trusted-proxy"`.
- Zie [Beveiliging](/nl/gateway/security) en [Tailscale](/nl/gateway/tailscale).

## WhatsApp-inlogflow (extern)

- Voer `openclaw channels login --verbose` **op de externe host** uit. Scan de QR-code met WhatsApp op je telefoon.
- Voer login opnieuw uit op die host als authenticatie verloopt. Health check toont verbindingsproblemen.

## Probleemoplossing

- **exit 127 / niet gevonden**: `openclaw` staat niet op PATH voor niet-login-shells. Voeg het toe aan `/etc/paths`, je shell-rc, of maak een symlink naar `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health-probe mislukt**: controleer SSH-bereikbaarheid, PATH en of Baileys is ingelogd (`openclaw status --json`).
- **Web Chat loopt vast**: bevestig dat de gateway op de externe host draait en dat de doorgestuurde poort overeenkomt met de gateway-WS-poort; de UI vereist een gezonde WS-verbinding.
- **Node-IP toont 127.0.0.1**: verwacht bij de SSH-tunnel. Zet **Transport** op **Direct (ws/wss)** als je wilt dat de gateway het echte client-IP-adres ziet.
- **Dashboard werkt maar Mac-capaciteiten zijn offline**: dit betekent dat de operator-/besturingsverbinding van de app gezond is, maar dat de bijbehorende nodeverbinding niet verbonden is of het opdrachtoppervlak mist. Open de apparaatsectie in de menubalk en controleer of de Mac `paired · disconnected` is. Voor `wss://*.ts.net` Tailscale Serve-eindpunten detecteert de app verouderde legacy TLS-leaf-pins na certificaatrotatie, wist de verouderde pin wanneer macOS het nieuwe certificaat vertrouwt, en probeert automatisch opnieuw. Als het certificaat niet door het systeem wordt vertrouwd of de host geen Tailscale Serve-naam is, stel dan `gateway.remote.tlsFingerprint` in op de verwachte certificaatvingerafdruk, controleer het certificaat, of schakel over naar **Extern via SSH**.
- **Voice Wake**: triggerzinnen worden automatisch doorgestuurd in externe modus; er is geen aparte doorstuurservice nodig.

## Meldingsgeluiden

Kies geluiden per melding vanuit scripts met `openclaw` en `node.invoke`, bijvoorbeeld:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Er is geen globale schakelaar voor "standaardgeluid" meer in de app; aanroepers kiezen per verzoek een geluid (of geen geluid).

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [Externe toegang](/nl/gateway/remote)
