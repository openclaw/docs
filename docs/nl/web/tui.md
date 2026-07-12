---
read_when:
    - Je wilt een beginnersvriendelijke rondleiding door de TUI
    - Je hebt de volledige lijst met TUI-functies, -opdrachten en -sneltoetsen nodig
summary: 'Terminalinterface (TUI): maak verbinding met de Gateway of voer lokaal uit in de ingebedde modus'
title: TUI
x-i18n:
    generated_at: "2026-07-12T09:32:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d7181ea88643a129532f698908fd3dd3d93078b7e33b0ab1166dcfca2ecc2abd
    source_path: web/tui.md
    workflow: 16
---

## Snel aan de slag

### Gateway-modus

1. Start de Gateway.

```bash
openclaw gateway
```

2. Open de TUI.

```bash
openclaw tui
```

3. Typ een bericht en druk op Enter.

Externe Gateway:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Gebruik `--password` als je Gateway wachtwoordauthenticatie gebruikt.

### Lokale modus

Voer de TUI uit zonder Gateway:

```bash
openclaw chat
# of
openclaw tui --local
```

- `openclaw chat` en `openclaw terminal` zijn aliassen voor `openclaw tui --local`.
- `--local` kan niet worden gecombineerd met `--url`, `--token` of `--password`.
- De lokale modus gebruikt de ingebedde agentruntime rechtstreeks. De meeste lokale tools werken, maar functies die alleen via de Gateway beschikbaar zijn, zijn niet beschikbaar.
- Een kale aanroep van `openclaw` (zonder subopdracht) kiest automatisch een doel: bij een niet-geconfigureerde installatie wordt de onboarding voor inferentie uitgevoerd; bij een ongeldige configuratie wordt de klassieke Doctor-begeleiding geopend; bij een bereikbare, geconfigureerde Gateway wordt deze TUI-shell in Gateway-modus geopend; anders wordt deze met een geconfigureerd lokaal model in lokale modus geopend.

## Wat je ziet

- Koptekst: verbindings-URL, huidige agent, huidige sessie.
- Chatlogboek: gebruikersberichten, antwoorden van de assistent, systeemmeldingen, toolkaarten.
- Statusregel: verbindings-/uitvoeringsstatus (verbinden, actief, streamen, inactief, fout).
- Voettekst: agent + sessie + model + doelstatus + denken/snel/uitgebreid/traceren/redeneren + aantallen tokens + bezorgen. Wanneer `tui.footer.showRemoteHost` is ingeschakeld, tonen verbindingen met een externe Gateway ook de verbindingshost.
- Invoer: teksteditor met automatisch aanvullen.

## Mentaal model: agents + sessies

- Agents hebben unieke slugs (bijvoorbeeld `main`, `research`). De Gateway stelt de lijst beschikbaar.
- Sessies behoren tot de huidige agent.
- Sessiesleutels worden opgeslagen als `agent:<agentId>:<sessionKey>`.
  - Als je `/session main` typt, breidt de TUI dit uit tot `agent:<currentAgent>:main`.
  - Als je `/session agent:other:main` typt, schakel je expliciet over naar die agentsessie.
- Sessiebereik:
  - `per-sender` (standaard): elke agent heeft meerdere sessies.
  - `global`: de TUI gebruikt altijd de sessie `global` (de keuzelijst kan leeg zijn).
- De huidige agent + sessie zijn altijd zichtbaar in de voettekst.
- Schakel de volgende optie in om de Gateway-host te tonen voor niet-lokale verbindingen via een URL:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  De standaardwaarde is `false`. Verbindingen via local loopback en ingebedde lokale verbindingen tonen nooit een hostlabel.

- Als de sessie een [doel](/nl/tools/goal) heeft, toont de voettekst de compacte status ervan:
  `Doel wordt nagestreefd`, `Doel gepauzeerd (/goal resume)`, `Doel geblokkeerd (/goal resume)` of `Doel bereikt`.
- Wanneer de TUI zonder `--session` wordt gestart, hervat deze in Gateway-modus de laatst geselecteerde sessie voor dezelfde Gateway, agent en hetzelfde sessiebereik, als die sessie nog bestaat. Het doorgeven van `--session` of het gebruik van `/session`, `/new` of `/reset` blijft een expliciete keuze.

## Verzenden + bezorgen

- Berichten gaan altijd naar de Gateway (of naar de ingebedde runtime in lokale modus); het antwoord van de assistent vervolgens bij een chatprovider bezorgen is een afzonderlijke stap die standaard is uitgeschakeld.
- De TUI is een intern bronoppervlak zoals WebChat, geen generiek uitgaand kanaal. Harnassen die `tools.message` vereisen voor zichtbare antwoorden, kunnen de actieve TUI-beurt afhandelen met een doelloze `message.send`; expliciete bezorging via een provider gebruikt nog steeds de normaal geconfigureerde kanalen en valt nooit terug op `lastChannel`.
- Bezorging wordt bij het starten voor de volledige TUI-sessie vastgelegd: start met `openclaw tui --deliver` om deze in te schakelen. Er is geen slashopdracht `/deliver` of schakelaar in Instellingen om dit tijdens een sessie te wijzigen; start de TUI opnieuw om dit aan te passen.

## Keuzelijsten + overlays

- Modelkeuzelijst: beschikbare modellen weergeven en de sessie-override instellen.
- Agentkeuzelijst: een andere agent kiezen.
- Sessiekeuzelijst: toont maximaal 50 sessies voor de huidige agent die in de afgelopen 7 dagen zijn bijgewerkt. Gebruik `/session <key>` om naar een oudere, bekende sessie te gaan.
- Instellingen (`/settings`): de uitgevouwen weergave van tooluitvoer en de zichtbaarheid van denkstappen in- of uitschakelen. Dit paneel regelt de bezorging niet.

## Sneltoetsen

- Enter: bericht verzenden
- Esc: actieve uitvoering afbreken
- Ctrl+C: invoer wissen (druk tweemaal om af te sluiten)
- Ctrl+D: afsluiten
- Ctrl+L: modelkeuzelijst
- Ctrl+G: agentkeuzelijst
- Ctrl+P: sessiekeuzelijst
- Ctrl+O: uitgevouwen weergave van tooluitvoer in- of uitschakelen
- Ctrl+T: zichtbaarheid van denkstappen in- of uitschakelen (laadt geschiedenis opnieuw)

## Slashopdrachten

Kern:

- `/help`
- `/status` (doorgestuurd naar de Gateway; toont een overzicht van sessie/model)
- `/gateway-status` (alias `/gwstatus`; toont rechtstreeks de verbindingsstatus van de Gateway)
- `/agent <id>` (of `/agents`)
- `/session <key>` (of `/sessions`)
- `/model <provider/model>` (of `/models`)

Sessiebeheer:

- `/think <off|minimal|low|medium|high>` (hogere niveaus kunnen afhankelijk van het model aanvullende niveaus zoals `xhigh`/`max` toevoegen)
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default` wist de sessie-override)
- `/goal [status] | /goal start <objective> | /goal edit <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`

Levenscyclus van sessies:

- `/new` (maakt een nieuwe, geïsoleerde sessie onder een nieuwe sleutel; heeft geen invloed op andere TUI-clients in de oude sessie)
- `/reset` (stelt de huidige sessiesleutel ter plaatse opnieuw in)
- `/abort` (breekt de actieve uitvoering af)
- `/settings`
- `/exit` (of `/quit`)

Alleen lokale modus:

- `/auth [provider]` opent de authenticatie-/aanmeldingsstroom van de provider in de TUI.

Crestodian:

- `/crestodian [request]` keert vanuit de normale agent-TUI terug naar de [Crestodian](#crestodian-setup-and-repair-helper)-chat voor installatie/herstel en stuurt desgewenst één verzoek door.

Andere slashopdrachten van de Gateway (bijvoorbeeld `/context`) worden doorgestuurd naar de Gateway en als systeemuitvoer weergegeven. Zie [Slashopdrachten](/nl/tools/slash-commands).

## Lokale shellopdrachten

- Laat een regel beginnen met `!` om een lokale shellopdracht uit te voeren op de TUI-host.
- De TUI vraagt eenmaal per sessie toestemming voor lokale uitvoering; als je weigert, blijft `!` voor de sessie uitgeschakeld.
- Opdrachten worden uitgevoerd in een nieuwe, niet-interactieve shell in de werkmap van de TUI (zonder blijvende `cd`/omgevingsvariabelen).
- Lokale shellopdrachten ontvangen `OPENCLAW_SHELL=tui-local` in hun omgeving.
- Een losse `!` wordt als normaal bericht verzonden; voorafgaande spaties activeren geen lokale uitvoering.

## Crestodian-helper voor installatie en herstel

Crestodian is de installatie-/herstelassistent op ring nul, beschikbaar als `openclaw crestodian` nadat het geconfigureerde standaardmodel voor een live inferentiecontrole is geslaagd. Als inferentie niet beschikbaar is, keert een interactieve aanroep terug naar de onboarding voor inferentie en mislukt automatisering met herstelbegeleiding. Crestodian wordt uitgevoerd in dezelfde lokale TUI-shell als `openclaw tui --local`, ondersteund door een AI-agent die is beperkt tot de getypeerde bewerkingen van Crestodian waarvoor goedkeuring vereist is:

```bash
openclaw crestodian                       # interactief starten
openclaw crestodian -m "status"           # één verzoek uitvoeren en afsluiten
openclaw crestodian -m "set default model openai/gpt-5.2" --yes   # een configuratiewijziging toepassen
```

- Voor blijvende configuratiewijzigingen is goedkeuring nodig: bevestig deze interactief of geef `--yes` door.
- `--json` drukt het opstartoverzicht af als JSON in plaats van de chat te starten.
- Vanuit Crestodian zorgt een `open-tui`-verzoek (bijvoorbeeld de vraag om met een normale agent te praten) ervoor dat Crestodian wordt afgesloten en de reguliere agent-TUI wordt geopend; gebruik daar `/crestodian` om terug te keren.

Gebruik de lokale modus wanneer de huidige configuratie al geldig is en je wilt dat de ingebedde agent deze op dezelfde machine inspecteert, met de documentatie vergelijkt en afwijkingen helpt herstellen zonder afhankelijk te zijn van een actieve Gateway.

Als `openclaw config validate` al mislukt, begin dan eerst met `openclaw configure` of `openclaw doctor --fix`; `openclaw chat` heeft nog steeds een laadbare configuratie nodig om te starten.

Typische werkwijze:

1. Start de lokale modus:

```bash
openclaw chat
```

2. Vraag de agent wat je wilt laten controleren, bijvoorbeeld:

```text
Vergelijk mijn Gateway-authenticatieconfiguratie met de documentatie en stel de kleinste oplossing voor.
```

3. Gebruik lokale shellopdrachten voor exact bewijs en validatie:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Pas beperkte wijzigingen toe met `openclaw config set` of `openclaw configure` en voer vervolgens `!openclaw config validate` opnieuw uit.
5. Als Doctor een automatische migratie of reparatie aanbeveelt, beoordeel deze dan en voer `!openclaw doctor --fix` uit.

Tips:

- Geef de voorkeur aan `openclaw config set` of `openclaw configure` boven het handmatig bewerken van `openclaw.json`.
- `openclaw docs "<query>"` doorzoekt de live documentatie-index vanaf dezelfde machine.
- `openclaw config validate --json` is handig wanneer je gestructureerde schemafouten en fouten met SecretRef/oplosbaarheid wilt.

## Tooluitvoer

- Toolaanroepen worden weergegeven als kaarten met argumenten + resultaten.
- Ctrl+O schakelt tussen ingeklapte en uitgevouwen weergaven.
- Terwijl tools worden uitgevoerd, worden gedeeltelijke updates naar dezelfde kaart gestreamd.

## Terminalkleuren

- De TUI houdt de hoofdtekst van de assistent in de standaardvoorgrondkleur van je terminal, zodat zowel donkere als lichte terminals leesbaar blijven.
- Als je terminal een lichte achtergrond gebruikt en de automatische detectie onjuist is, stel je `OPENCLAW_THEME=light` in voordat je `openclaw tui` start.
- Stel in plaats daarvan `OPENCLAW_THEME=dark` in om het oorspronkelijke donkere palet af te dwingen.

## Geschiedenis + streaming

- Bij het verbinden laadt de TUI de meest recente geschiedenis (standaard 200 berichten).
- Streamingantwoorden worden ter plaatse bijgewerkt totdat ze zijn voltooid.
- De TUI luistert ook naar toolgebeurtenissen van agents voor uitgebreidere toolkaarten.

## Verbindingsdetails

- De TUI maakt verbinding met client-id `openclaw-tui` onder de globale clientmodus `ui` (dezelfde modus die Control UI en WebChat gebruiken voor Gateway-beleid).
- Bij nieuwe verbindingen wordt een systeembericht weergegeven; hiaten in gebeurtenissen worden in het logboek gemeld.

## Opties

- `--local`: Uitvoeren met de lokale ingebedde agentruntime
- `--url <url>`: WebSocket-URL van de Gateway (standaard `gateway.remote.url` uit de configuratie, of `ws://127.0.0.1:<port>` via local loopback)
- `--token <token>`: Gateway-token (indien vereist)
- `--password <password>`: Gateway-wachtwoord (indien vereist)
- `--tls-fingerprint <sha256>`: Verwachte vingerafdruk van het TLS-certificaat voor een vastgezette `wss://`-Gateway
- `--session <key>`: Sessiesleutel (standaard: `main`, of `global` wanneer het bereik globaal is)
- `--deliver`: Antwoorden van de assistent bij de provider bezorgen (standaard uitgeschakeld)
- `--thinking <level>`: Denkniveau voor verzendingen overschrijven
- `--message <text>`: Een eerste bericht verzenden nadat verbinding is gemaakt
- `--timeout-ms <ms>`: Time-out van de agent in ms (standaard `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Aantal te laden geschiedenisitems (standaard `200`)

<Warning>
Wanneer je `--url` instelt, valt de TUI niet terug op referenties uit de configuratie of omgeving. Geef `--token` of `--password` expliciet door, plus `--tls-fingerprint` wanneer het doel een vastgezet certificaat gebruikt. Ontbrekende expliciete referenties leiden tot een fout. Geef in de lokale modus geen `--url`, `--token`, `--password` of `--tls-fingerprint` door.
</Warning>

## Problemen oplossen

Geen uitvoer na het verzenden van een bericht:

- Voer `/status` uit in de TUI om te bevestigen dat de Gateway is verbonden en inactief/bezig is.
- Controleer de Gateway-logboeken: `openclaw logs --follow`.
- Controleer of de agent kan worden uitgevoerd: `openclaw status` en `openclaw models status`.
- Als je berichten in een chatkanaal verwacht, controleer dan of de TUI is gestart met `--deliver` (dit kan later niet worden ingeschakeld zonder opnieuw te starten).

## Verbindingsproblemen oplossen

- `disconnected`: controleer of de Gateway actief is en of je `--url/--token/--password` correct zijn.
- Geen agents in de keuzelijst: controleer `openclaw agents list` en je routeringsconfiguratie.
- Lege sessiekeuzelijst: mogelijk gebruik je een globaal bereik of heb je nog geen sessies.

## Gerelateerd

- [Control UI](/nl/web/control-ui) — webgebaseerde beheerinterface
- [Configuratie](/nl/cli/config) — `openclaw.json` inspecteren, valideren en bewerken
- [Doctor](/nl/cli/doctor) — begeleide herstel- en migratiecontroles
- [CLI-referentie](/nl/cli) — volledige referentie van CLI-opdrachten
