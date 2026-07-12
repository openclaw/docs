---
read_when:
    - Mac-bediening op afstand instellen of fouten erin opsporen
summary: macOS-appflow voor het beheren van een externe OpenClaw-Gateway
title: Afstandsbediening
x-i18n:
    generated_at: "2026-07-12T09:04:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd3ee71838737c1b8cf67d91d00b135283f4284400c75309646e62921e8c3633
    source_path: platforms/mac/remote.md
    workflow: 16
---

Met deze flow kan de macOS-app fungeren als volledige afstandsbediening voor een OpenClaw-Gateway die op een andere host (desktop/server) draait. De app maakt rechtstreeks verbinding met vertrouwde Gateway-URL's op het LAN/de Tailnet, of beheert een SSH-tunnel wanneer de externe Gateway uitsluitend via local loopback bereikbaar is. Statuscontroles, het doorsturen van Voice Wake en Web Chat gebruiken opnieuw dezelfde externe configuratie uit _Settings -> General_.

## Modi

- **Lokaal (deze Mac)**: alles draait op de laptop; er is geen SSH bij betrokken.
- **Extern via SSH (standaard)**: OpenClaw-opdrachten worden op de externe host uitgevoerd. De app opent een SSH-verbinding met `-o BatchMode`, de door jou gekozen identiteit/sleutel en lokale poortdoorschakeling.
- **Rechtstreeks extern (ws/wss)**: geen SSH-tunnel; de app maakt rechtstreeks verbinding met de Gateway-URL (LAN, Tailscale, Tailscale Serve of een openbare HTTPS-reverseproxy).

## Externe transportmethoden

- **SSH-tunnel** (standaard): gebruikt `ssh -N -L ...` om de Gateway-poort door te sturen naar localhost. De Gateway ziet het IP-adres van de Node als `127.0.0.1`, omdat de tunnel via local loopback loopt.
- **Rechtstreeks (ws/wss)**: maakt rechtstreeks verbinding met de Gateway-URL. De Gateway ziet het werkelijke IP-adres van de client.

De app schakelt SSH-verbindingsmultiplexing en uitvoering op de achtergrond na authenticatie uit voor de eigen SSH-processen, zodat het exacte proces kan worden bewaakt en opnieuw gestart, zelfs als de geselecteerde alias `ControlMaster` of `ForkAfterAuthentication` inschakelt.

SSH-hostsleutelverificatie is standaard strikt, omdat Gateway-inloggegevens door deze tunnel worden verzonden. Als je het eigen vertrouwensgedrag van een beheerde SSH-alias wilt gebruiken, stel je `--ssh-host-key-policy openssh` in via `openclaw-mac configure-remote`, of stel je `gateway.remote.sshHostKeyPolicy` rechtstreeks in op `"openssh"`. Controleer de alias en eventuele overeenkomende `Host *`- of systeemconfiguratie voordat je hiervoor kiest. Als je het SSH-doel wijzigt (in de app of via `configure-remote`), wordt het beleid teruggezet op `strict`, tenzij je voor het nieuwe doel opnieuw expliciet hiervoor kiest.

In de SSH-tunnelmodus worden ontdekte LAN-/Tailnet-hostnamen opgeslagen als `gateway.remote.sshTarget`. De app houdt `gateway.remote.url` ingesteld op het lokale tunneleindpunt (bijvoorbeeld `ws://127.0.0.1:18789`), zodat de CLI, Web Chat en de lokale Node-hostservice allemaal hetzelfde local loopback-transport gebruiken. Wanneer de detectie zowel onbewerkte Tailnet-IP-adressen als stabiele hostnamen oplevert, geeft de app de voorkeur aan Tailscale MagicDNS- of LAN-namen, zodat verbindingen beter bestand zijn tegen adreswijzigingen. Als de lokale tunnelpoort afwijkt van de externe Gateway-poort, stel je `gateway.remote.remotePort` in op de poort van de externe host.

Browserautomatisering in externe modus valt onder de CLI-Node-host en niet onder de Node van de native macOS-app. De app start waar mogelijk de geïnstalleerde Node-hostservice. Om browserbesturing vanaf die Mac in te schakelen, installeer/start je deze met `openclaw node install ...` en `openclaw node start` (of voer je `openclaw node run ...` op de voorgrond uit) en kies je vervolgens die browsergeschikte Node als doel.

## Vereisten op de externe host

1. Installeer Node + pnpm en bouw/installeer de OpenClaw-CLI (`pnpm install && pnpm build && pnpm link --global`).
2. Zorg dat `openclaw` op PATH staat voor niet-interactieve shells (maak indien nodig een symbolische koppeling in `/usr/local/bin` of `/opt/homebrew/bin`).
3. Voor SSH-transport: stel SSH-authenticatie op basis van sleutels in. Tailscale-IP-adressen worden aanbevolen voor stabiele bereikbaarheid buiten het LAN.

## De macOS-app instellen

Om de app vooraf te configureren zonder de welkomstflow, via SSH:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway-host \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Of sla SSH volledig over voor een Gateway die al bereikbaar is via een vertrouwd LAN of een vertrouwde Tailnet:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Beide vormen schrijven naar `~/.openclaw/openclaw.json`, markeren de onboarding als voltooid en laten de app bij de volgende start het geselecteerde transport beheren. `--local-port`/`--remote-port` hebben standaard de waarde `18789`. Andere vlaggen: `--password`, `--identity <path>`, `--ssh-host-key-policy <strict|openssh>`, `--project-root <path>`, `--cli-path <path>`, `--json`. Voer `openclaw-mac configure-remote --help` uit voor de volledige documentatie.

Om dit in plaats daarvan via de gebruikersinterface te configureren:

1. Open _Settings -> General_.
2. Kies onder **OpenClaw runs** de optie **Remote** en stel het volgende in:
   - **Transport**: **SSH tunnel** of **Direct (ws/wss)**.
   - **SSH target**: `user@host` (optioneel `:port`). Als de Gateway zich op hetzelfde LAN bevindt en via Bonjour wordt aangekondigd, selecteer je deze in de lijst met gedetecteerde apparaten om dit veld automatisch in te vullen.
   - **Gateway URL** (alleen Direct): `wss://gateway.example.ts.net` (of `ws://...` voor lokaal/LAN).
   - **Identity file** (geavanceerd): pad naar je sleutel.
   - **Project root** (geavanceerd): pad naar de externe checkout die voor opdrachten wordt gebruikt.
   - **CLI path** (geavanceerd): optioneel pad naar een uitvoerbaar `openclaw`-toegangspunt/binair bestand (wordt automatisch ingevuld als dit wordt aangekondigd).
3. Klik op **Test remote**. Bij succes is de externe opdracht `openclaw status --json` correct uitgevoerd. Fouten wijzen meestal op problemen met PATH/de CLI; afsluitcode 127 betekent dat de CLI niet op de externe host is gevonden.
4. Statuscontroles en Web Chat werken nu automatisch via het geselecteerde transport.

## Web Chat

- **SSH-tunnel**: maakt verbinding met de Gateway via de doorgestuurde WebSocket-besturingspoort (standaard 18789).
- **Rechtstreeks (ws/wss)**: maakt rechtstreeks verbinding met de geconfigureerde Gateway-URL.
- Er is geen afzonderlijke HTTP-server voor Web Chat.

## Machtigingen

- De externe host heeft dezelfde TCC-goedkeuringen nodig als de lokale host (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Doorloop de onboarding eenmaal op die machine om deze te verlenen.
- Nodes maken de status van hun machtigingen bekend via `node.list` / `node.describe`, zodat agents weten wat beschikbaar is.

## Beveiligingsopmerkingen

- Geef op de externe host de voorkeur aan koppelingen met local loopback en maak verbinding via SSH, Tailscale Serve of een vertrouwde rechtstreekse URL op de Tailnet/het LAN.
- Voor SSH-tunneling is standaard een al vertrouwde hostsleutel vereist. Vertrouw eerst de hostsleutel (voeg deze toe aan het geconfigureerde bestand met bekende hosts), of stel expliciet `gateway.remote.sshHostKeyPolicy: "openssh"` in voor een beheerde alias waarvan je het OpenSSH-vertrouwensbeleid accepteert.
- Als je de Gateway aan een andere interface dan local loopback koppelt, vereis dan geldige Gateway-authenticatie: een token, wachtwoord of identiteitsbewuste reverseproxy met `gateway.auth.mode: "trusted-proxy"`.
- Zie [Beveiliging](/nl/gateway/security) en [Tailscale](/nl/gateway/tailscale).

## WhatsApp-aanmeldingsflow (extern)

- Voer `openclaw channels login --channel whatsapp --verbose` **op de externe host** uit. Scan de QR-code met WhatsApp op je telefoon.
- Meld je opnieuw aan op die host als de authenticatie verloopt. De statuscontrole brengt koppelingsproblemen aan het licht.

## Probleemoplossing

| Symptoom                                         | Oorzaak / oplossing                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exit 127` / niet gevonden                       | `openclaw` staat niet in PATH voor niet-aanmeldingsshells. Voeg het toe aan `/etc/paths` of het rc-bestand van uw shell, of maak een symbolische koppeling in `/usr/local/bin`/`/opt/homebrew/bin`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Statuscontrole mislukt                           | Controleer de bereikbaarheid via SSH, PATH en of Baileys (WhatsApp) is aangemeld (`openclaw status --json`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Webchat reageert niet                            | Controleer of de Gateway op de externe host wordt uitgevoerd en of de doorgestuurde poort overeenkomt met de WS-poort van de Gateway; de gebruikersinterface vereist een correct werkende WS-verbinding.                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| IP-adres van Node toont `127.0.0.1`              | Dit is te verwachten bij de SSH-tunnel. Stel **Transport** in op **Direct (ws/wss)** als u wilt dat de Gateway het werkelijke IP-adres van de client ziet.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Dashboard werkt, maar Mac-mogelijkheden zijn offline | De operator-/besturingsverbinding werkt correct, maar de verbinding met de begeleidende Node is niet tot stand gebracht of het bijbehorende opdrachtenoppervlak ontbreekt. Open het apparaatgedeelte in de menubalk en controleer of de Mac als `paired · disconnected` wordt weergegeven. Voor Tailscale Serve-eindpunten met `wss://*.ts.net` detecteert de app verouderde TLS-leafpinnen na certificaatrotatie, wist de verouderde pin zodra macOS het nieuwe certificaat vertrouwt en probeert het automatisch opnieuw. Als het certificaat niet door het systeem wordt vertrouwd of de host geen Tailscale Serve-naam heeft, stelt u `gateway.remote.tlsFingerprint` in op de verwachte certificaatvingerafdruk, controleert u het certificaat of schakelt u over naar **Remote over SSH**. |
| Stemactivering                                   | Activeringszinnen worden in de externe modus automatisch doorgestuurd; er is geen afzonderlijke doorstuurservice nodig.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

## Meldingsgeluiden

Kies per melding geluiden uit scripts met `openclaw nodes notify`, bijvoorbeeld:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

De app heeft geen algemene schakelaar voor een standaardgeluid; aanroepers kiezen per aanvraag een geluid (of geen geluid).

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [Externe toegang](/nl/gateway/remote)
