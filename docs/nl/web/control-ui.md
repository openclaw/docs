---
read_when:
    - U wilt de Gateway vanuit een browser bedienen
    - Je wilt Tailnet-toegang zonder SSH-tunnels
sidebarTitle: Control UI
summary: Browsergebaseerde beheer-UI voor de Gateway (chat, activiteit, knooppunten, configuratie)
title: Controle-UI
x-i18n:
    generated_at: "2026-07-03T09:47:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b23d0e2aeefc3b746f1ab51cd9049135e2695ab77cf5cbb5eab6ec0df90f011d
    source_path: web/control-ui.md
    workflow: 16
---

De Control UI is een kleine **Vite + Lit** single-page-app die door de Gateway wordt geserveerd:

- standaard: `http://<host>:18789/`
- optioneel voorvoegsel: stel `gateway.controlUi.basePath` in (bijv. `/openclaw`)

Deze communiceert **rechtstreeks met de Gateway WebSocket** op dezelfde poort.

## Snel openen (lokaal)

Als de Gateway op dezelfde computer draait, open dan:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (of [http://localhost:18789/](http://localhost:18789/))

Als de pagina niet laadt, start dan eerst de Gateway: `openclaw gateway`.

<Note>
Bij native Windows-LAN-binds kan Windows Firewall of door de organisatie beheerde Group Policy de geadverteerde LAN-URL nog steeds blokkeren, zelfs wanneer `127.0.0.1` werkt op de Gateway-host. Voer `openclaw gateway status --deep` uit op de Windows-host; dit rapporteert waarschijnlijk geblokkeerde poorten, profielverschillen en lokale firewallregels die door beleid mogelijk worden genegeerd.
</Note>

Auth wordt tijdens de WebSocket-handshake geleverd via:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve-identiteitsheaders wanneer `gateway.auth.allowTailscale: true`
- trusted-proxy-identiteitsheaders wanneer `gateway.auth.mode: "trusted-proxy"`

Het instellingenpaneel van het dashboard bewaart een token voor de huidige browsertabsessie en de geselecteerde gateway-URL; wachtwoorden worden niet bewaard. Onboarding genereert meestal bij de eerste verbinding een gateway-token voor shared-secret-auth, maar wachtwoordauth werkt ook wanneer `gateway.auth.mode` `"password"` is.

## Apparaat koppelen (eerste verbinding)

Wanneer je vanaf een nieuwe browser of apparaat verbinding maakt met de Control UI, vereist de Gateway meestal een **eenmalige koppelingsgoedkeuring**. Dit is een beveiligingsmaatregel om onbevoegde toegang te voorkomen.

**Wat je ziet:** "disconnected (1008): pairing required"

<Steps>
  <Step title="Openstaande aanvragen weergeven">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Goedkeuren op aanvraag-ID">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Als de browser opnieuw koppelt met gewijzigde auth-gegevens (rol/scopes/publieke sleutel), wordt de vorige openstaande aanvraag vervangen en wordt een nieuwe `requestId` aangemaakt. Voer `openclaw devices list` opnieuw uit vóór goedkeuring.

Als de browser al gekoppeld is en je deze wijzigt van leestoegang naar schrijf-/beheertoegang, wordt dit behandeld als een goedkeuringsupgrade, niet als een stille herverbinding. OpenClaw houdt de oude goedkeuring actief, blokkeert de bredere herverbinding en vraagt je om de nieuwe set scopes expliciet goed te keuren.

Na goedkeuring wordt het apparaat onthouden en is geen hergoedkeuring nodig, tenzij je het intrekt met `openclaw devices revoke --device <id> --role <role>`. Zie [Devices CLI](/nl/cli/devices) voor tokenrotatie en intrekking.

Paperclip-agents die verbinding maken via de `openclaw_gateway`-adapter gebruiken dezelfde goedkeuringsflow bij eerste gebruik. Voer na de eerste verbindingspoging `openclaw devices approve --latest` uit om de openstaande aanvraag te bekijken, en voer daarna opnieuw de afgedrukte opdracht `openclaw devices approve <requestId>` uit om deze goed te keuren. Geef expliciete waarden voor `--url` en `--token` door voor een externe gateway. Configureer in Paperclip een persistente `adapterConfig.devicePrivateKeyPem` in plaats van per run een nieuwe tijdelijke apparaatidentiteit te laten genereren om goedkeuringen stabiel te houden tussen herstarts.

<Note>
- Directe browserverbindingen via local loopback (`127.0.0.1` / `localhost`) worden automatisch goedgekeurd.
- Tailscale Serve kan de koppelingsronde overslaan voor Control UI-operatorsessies wanneer `gateway.auth.allowTailscale: true`, de Tailscale-identiteit wordt geverifieerd en de browser zijn apparaatidentiteit presenteert.
- Directe Tailnet-binds, LAN-browserverbindingen en browserprofielen zonder apparaatidentiteit vereisen nog steeds expliciete goedkeuring.
- Elk browserprofiel genereert een unieke apparaat-ID, dus wisselen van browser of wissen van browsergegevens vereist opnieuw koppelen.

</Note>

## Persoonlijke identiteit (browserlokaal)

De Control UI ondersteunt een persoonlijke identiteit per browser (weergavenaam en avatar) die aan uitgaande berichten wordt gekoppeld voor toeschrijving in gedeelde sessies. Deze staat in browseropslag, is beperkt tot het huidige browserprofiel en wordt niet gesynchroniseerd naar andere apparaten of server-side bewaard buiten de normale transcript-auteurschapsmetadata op berichten die je daadwerkelijk verstuurt. Sitegegevens wissen of van browser wisselen zet deze terug naar leeg.

Hetzelfde browserlokale patroon geldt voor de override van de assistent-avatar. Geüploade assistent-avatars leggen alleen in de lokale browser een laag over de door de gateway opgeloste identiteit en maken nooit een roundtrip via `config.patch`. Het gedeelde configuratieveld `ui.assistant.avatar` blijft beschikbaar voor niet-UI-clients die het veld rechtstreeks schrijven (zoals gescripte gateways of aangepaste dashboards).

## Runtimeconfiguratie-eindpunt

De Control UI haalt zijn runtime-instellingen op uit `/control-ui-config.json`, opgelost relatief aan het Control UI-basispad van de gateway (bijvoorbeeld `/__openclaw__/control-ui-config.json` wanneer de UI onder `/__openclaw__/` wordt geserveerd). Dat eindpunt wordt afgeschermd door dezelfde gateway-auth als de rest van het HTTP-oppervlak: niet-geauthenticeerde browsers kunnen het niet ophalen, en een succesvolle fetch vereist een al geldig gateway-token/wachtwoord, Tailscale Serve-identiteit of trusted-proxy-identiteit.

## Taalondersteuning

De Control UI kan zichzelf bij de eerste laadbeurt lokaliseren op basis van je browserlocale. Open **Overview -> Gateway Access -> Language** om dit later te overschrijven. De locale-kiezer staat in de kaart Gateway Access, niet onder Appearance.

- Ondersteunde locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Niet-Engelse vertalingen worden lazy-loaded in de browser.
- De geselecteerde locale wordt opgeslagen in browseropslag en hergebruikt bij toekomstige bezoeken.
- Ontbrekende vertaalsleutels vallen terug op Engels.

Docs-vertalingen worden gegenereerd voor dezelfde niet-Engelse localeset, maar de ingebouwde Mintlify-taalkiezer van de documentatiesite is beperkt tot de localecodes die Mintlify accepteert. Thaise (`th`) en Perzische (`fa`) docs worden nog steeds gegenereerd in de publish-repo; ze verschijnen mogelijk pas in die kiezer zodra Mintlify die codes ondersteunt.

## Appearance-thema's

Het Appearance-paneel behoudt de ingebouwde Claw-, Knot- en Dash-thema's, plus één browserlokale tweakcn-importsleuf. Open [tweakcn editor](https://tweakcn.com/editor/theme), kies of maak een thema, klik op **Share** en plak de gekopieerde themalink in Appearance om een thema te importeren. De importer accepteert ook `https://tweakcn.com/r/themes/<id>`-registry-URL's, editor-URL's zoals `https://tweakcn.com/editor/theme?theme=amethyst-haze`, relatieve `/themes/<id>`-paden, ruwe thema-ID's en standaardthemanamen zoals `amethyst-haze`.

Appearance bevat ook een browserlokale instelling voor tekstgrootte. De instelling wordt opgeslagen met de rest van de Control UI-voorkeuren, is van toepassing op chattekst, composer-tekst, toolkaarten en chatzijbalken, en houdt tekstinvoer minstens 16px zodat mobiele Safari niet automatisch inzoomt bij focus.

Geïmporteerde thema's worden alleen in het huidige browserprofiel opgeslagen. Ze worden niet naar gateway-configuratie geschreven en synchroniseren niet tussen apparaten. Het geïmporteerde thema vervangen werkt de ene lokale sleuf bij; deze wissen schakelt het actieve thema terug naar Claw als het geïmporteerde thema geselecteerd was.

## Wat het kan doen (vandaag)

<AccordionGroup>
  <Accordion title="Chat en praten">
    - Chat met het model via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Vernieuwingen van de chatgeschiedenis vragen een begrensd recent venster op met tekstlimieten per bericht, zodat grote sessies de browser niet dwingen een volledige transcript-payload te renderen voordat de chat bruikbaar wordt.
    - Praat via realtime browsersessies. OpenAI gebruikt directe WebRTC, Google Live gebruikt een beperkte eenmalige browsertoken via WebSocket, en realtime spraakplugins die alleen backend zijn gebruiken het Gateway-relaytransport. Door de client beheerde providersessies starten met `talk.client.create`; Gateway-relaysessies starten met `talk.session.create`. De relay houdt providerreferenties op de Gateway terwijl de browser microfoon-PCM streamt via `talk.session.appendAudio`, stuurt `openclaw_agent_consult`-provider-toolcalls door via `talk.client.toolCall` voor Gateway-beleid en het grotere geconfigureerde OpenClaw-model, en routeert spraaksturing van actieve runs via `talk.client.steer` of `talk.session.steer`.
    - Stream toolcalls + live tooluitvoerkaarten in Chat (agent-events).
    - Activity-tab met browserlokale, redaction-first samenvattingen van live toolactiviteit uit bestaande `session.tool` / tool-eventlevering.

  </Accordion>
  <Accordion title="Kanalen, instanties, sessies, dreams">
    - Kanalen: ingebouwde plus gebundelde/externe plugin-kanaalstatus, QR-login en configuratie per kanaal (`channels.status`, `web.login.*`, `config.patch`).
    - Vernieuwingen van kanaalprobes houden de vorige snapshot zichtbaar terwijl trage providercontroles worden afgerond, en gedeeltelijke snapshots worden gelabeld wanneer een probe of audit het UI-budget overschrijdt.
    - Instanties: aanwezigheidslijst + vernieuwen (`system-presence`).
    - Sessies: toon standaard sessies van geconfigureerde agents, val terug vanaf verouderde niet-geconfigureerde agentsessiesleutels, en pas per sessie model-/thinking-/fast-/verbose-/trace-/reasoning-overrides toe (`sessions.list`, `sessions.patch`).
    - Dreams: dreaming-status, toggle voor inschakelen/uitschakelen en Dream Diary-lezer (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, nodes, exec-goedkeuringen">
    - Cron-taken: weergeven/toevoegen/bewerken/uitvoeren/inschakelen/uitschakelen + uitvoeringsgeschiedenis (`cron.*`).
    - Skills: status, inschakelen/uitschakelen, installeren, API-sleutelupdates (`skills.*`).
    - Nodes: weergeven + caps (`node.list`).
    - Exec-goedkeuringen: gateway- of node-allowlists bewerken + vraagbeleid voor `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuratie">
    - Bekijk/bewerk `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP heeft een speciale instellingenpagina voor geconfigureerde servers, inschakeling, OAuth-/filter-/parallelle samenvattingen, algemene operatoropdrachten en de scoped `mcp`-configuratie-editor.
    - Toepassen + opnieuw starten met validatie (`config.apply`) en de laatst actieve sessie wekken.
    - Schrijfacties bevatten een base-hash-guard om te voorkomen dat gelijktijdige bewerkingen worden overschreven.
    - Schrijfacties (`config.set`/`config.apply`/`config.patch`) preflighten actieve SecretRef-resolutie voor refs in de ingediende configuratie-payload; onopgeloste actieve ingediende refs worden vóór schrijven geweigerd.
    - Formulieropslagacties verwijderen verouderde geredigeerde placeholders die niet uit de opgeslagen configuratie kunnen worden hersteld, terwijl geredigeerde waarden die nog steeds aan opgeslagen geheimen zijn gekoppeld behouden blijven.
    - Schema + formulierrendering (`config.schema` / `config.schema.lookup`, inclusief veld `title` / `description`, overeenkomende UI-hints, directe onderliggende samenvattingen, docs-metadata op geneste object-/wildcard-/array-/composition-nodes, plus plugin- en kanaalschema's wanneer beschikbaar); de Raw JSON-editor is alleen beschikbaar wanneer de snapshot een veilige raw-roundtrip heeft.
    - Als een snapshot raw-tekst niet veilig kan roundtrippen, dwingt Control UI de Form-modus af en schakelt Raw-modus uit voor die snapshot.
    - Raw JSON-editor "Reset to saved" behoudt de raw-geschreven vorm (opmaak, opmerkingen, `$include`-lay-out) in plaats van een afgevlakte snapshot opnieuw te renderen, zodat externe bewerkingen een reset overleven wanneer de snapshot veilig kan roundtrippen.
    - Gestructureerde SecretRef-objectwaarden worden read-only gerenderd in formuliertekstinvoer om onbedoelde corruptie van object naar string te voorkomen.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debug: status-/health-/models-snapshots + eventlog + handmatige RPC-calls (`status`, `health`, `models.list`).
    - Het eventlog bevat Control UI-verversings-/RPC-timings, timing van trage chat-/config-rendering en vermeldingen over browserresponsiviteit voor lange animatieframes of lange taken wanneer de browser die PerformanceObserver-entrytypes beschikbaar stelt.
    - Logs: live tail van gateway-bestandslogs met filter/export (`logs.tail`).
    - Update: voer een package-/git-update + herstart uit (`update.run`) met een herstartrapport, en poll daarna `update.status` na herverbinding om de draaiende gateway-versie te verifiëren.

  </Accordion>
  <Accordion title="Notities bij het Cron-takenpaneel">
    - Voor geïsoleerde taken is de standaardlevering een aankondigingssamenvatting. Je kunt overschakelen naar geen als je alleen interne runs wilt.
    - Kanaal-/doelvelden verschijnen wanneer aankondigen is geselecteerd.
    - Webhook-modus gebruikt `delivery.mode = "webhook"` met `delivery.to` ingesteld op een geldige HTTP(S)-Webhook-URL.
    - Voor hoofdsessietaken zijn Webhook- en geen-leveringsmodi beschikbaar.
    - Geavanceerde bewerkingsopties omvatten verwijderen-na-run, agent-override wissen, exacte/gespreide Cron-opties, overrides voor agentmodel/denkmodus en best-effort-leveringsschakelaars.
    - Formuliervalidatie is inline met fouten per veld; ongeldige waarden schakelen de opslagknop uit totdat ze zijn opgelost.
    - Stel `cron.webhookToken` in om een speciale bearer-token te verzenden; als dit wordt weggelaten, wordt de Webhook zonder auth-header verzonden.
    - Verouderde fallback: voer `openclaw doctor --fix` uit om opgeslagen legacy-taken met `notify: true` te migreren van `cron.webhook` naar expliciete Webhook- of voltooiingslevering per taak.

  </Accordion>
</AccordionGroup>

## MCP-pagina

De speciale MCP-pagina is een operatorweergave voor door OpenClaw beheerde MCP-servers onder `mcp.servers`. Deze start MCP-transports niet zelf; gebruik de pagina om opgeslagen configuratie te inspecteren en te bewerken, en gebruik daarna `openclaw mcp doctor --probe` wanneer je live serverbewijs nodig hebt.

Typische workflow:

1. Open **MCP** via de zijbalk.
2. Controleer de overzichtskaarten voor aantallen totaal, ingeschakeld, OAuth en gefilterde servers.
3. Bekijk elke serverrij op transport, inschakeling, auth, filters, time-outs en opdrachthints.
4. Schakel inschakeling om wanneer een server geconfigureerd moet blijven maar buiten runtime-detectie moet blijven.
5. Bewerk de scoped `mcp`-configuratiesectie voor serverdefinities, headers, TLS/mTLS-paden, OAuth-metadata, toolfilters en Codex-projectiemetadata.
6. Gebruik **Opslaan** voor een configuratieschrijving, of **Opslaan en publiceren** wanneer de actieve Gateway de gewijzigde configuratie moet toepassen.
7. Voer `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` of `openclaw mcp reload` uit vanuit een terminal wanneer het bewerkte proces statische diagnostiek, live bewijs of verwijdering van gecachte runtime nodig heeft.

De pagina maskeert URL-achtige waarden die referenties bevatten voordat ze worden gerenderd en zet servernamen tussen aanhalingstekens in opdrachtfragmenten, zodat gekopieerde opdrachten ook blijven werken met spaties of shell-metatekens. De volledige CLI- en configuratiereferentie staat in [MCP](/nl/cli/mcp).

## Tabblad Activiteit

Het tabblad Activiteit is een vluchtige browserlokale observator voor live toolactiviteit. Het is afgeleid van dezelfde Gateway `session.tool` / tool-eventstream die Chat-toolkaarten aandrijft; het voegt geen extra Gateway-eventfamilie, endpoint, duurzame activiteitenopslag, metrics-feed of externe observatorstream toe.

Activiteitsitems bewaren alleen opgeschoonde samenvattingen en geredigeerde, ingekorte uitvoervoorbeelden. Toolargumentwaarden worden niet opgeslagen in de Activiteit-status; de UI toont dat argumenten verborgen zijn en registreert alleen het aantal argumentvelden. De lijst in het geheugen volgt het huidige browsertabblad, blijft behouden bij navigatie binnen de Control UI en wordt gereset bij pagina-herlading, sessiewissel of **Wissen**.

## Chatgedrag

<AccordionGroup>
  <Accordion title="Verzend- en geschiedenissemantiek">
    - `chat.send` is **niet-blokkerend**: het bevestigt onmiddellijk met `{ runId, status: "started" }` en de respons streamt via `chat`-events. Vertrouwde Control UI-clients kunnen ook optionele ACK-timingmetadata ontvangen voor lokale diagnostiek.
    - Chat-uploads accepteren afbeeldingen plus niet-videobestanden. Afbeeldingen behouden het native afbeeldingspad; andere bestanden worden opgeslagen als beheerde media en in de geschiedenis getoond als bijlagelinks.
    - Opnieuw verzenden met dezelfde `idempotencyKey` retourneert `{ status: "in_flight" }` zolang de run actief is, en `{ status: "ok" }` na voltooiing.
    - `chat.history`-responsen zijn qua grootte begrensd voor UI-veiligheid. Wanneer transcriptitems te groot zijn, kan Gateway lange tekstvelden inkorten, zware metadatablokken weglaten en te grote berichten vervangen door een placeholder (`[chat.history omitted: message too large]`).
    - Wanneer een zichtbaar assistentbericht is ingekort in `chat.history`, kan de zijlezer het volledige display-genormaliseerde transcriptitem op aanvraag ophalen via `chat.message.get` met `sessionKey`, actieve `agentId` wanneer nodig, en transcript-`messageId`. Als de Gateway nog steeds niet meer kan retourneren, toont de lezer een expliciete niet-beschikbaar-status in plaats van stilzwijgend de ingekorte preview te herhalen.
    - Assistent-/gegenereerde afbeeldingen worden bewaard als beheerde mediareferenties en teruggeleverd via geauthenticeerde Gateway-media-URL's, zodat herladen niet afhankelijk is van ruwe base64-afbeeldingspayloads die in de chatgeschiedenisrespons blijven staan.
    - Bij het renderen van `chat.history` verwijdert de Control UI display-only inline directivetags uit zichtbare assistenttekst (bijvoorbeeld `[[reply_to_*]]` en `[[audio_as_voice]]`), platte-tekst tool-call XML-payloads (waaronder `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en ingekorte tool-call-blokken), en gelekte ASCII-/full-width modelcontroltokens, en laat assistentitems weg waarvan de hele zichtbare tekst alleen het exacte stille token `NO_REPLY` / `no_reply` of het Heartbeat-bevestigingstoken `HEARTBEAT_OK` is.
    - Tijdens een actieve verzending en de uiteindelijke geschiedenisverversing houdt de chatweergave lokale optimistische gebruikers-/assistentberichten zichtbaar als `chat.history` kort een oudere snapshot retourneert; het canonieke transcript vervangt die lokale berichten zodra de Gateway-geschiedenis is bijgewerkt.
    - Live `chat`-events zijn leveringsstatus, terwijl `chat.history` opnieuw wordt opgebouwd uit het duurzame sessietranscript. Na tool-final-events laadt de Control UI de geschiedenis opnieuw en voegt alleen een kleine optimistische staart samen; de transcriptgrens is gedocumenteerd in [WebChat](/nl/web/webchat).
    - `chat.inject` voegt een assistentnotitie toe aan het sessietranscript en broadcast een `chat`-event voor alleen-UI-updates (geen agentrun, geen kanaallevering).
    - De zijbalk toont recente sessies met een Nieuwe sessie-actie, een link Alle sessies en een sessiezoekknop die de volledige sessiekiezer opent (gescoped op de geselecteerde agent, met zoeken en paginering). Wisselen van agent toont alleen sessies die aan die agent zijn gekoppeld en valt terug op de hoofdsessie van die agent wanneer deze nog geen opgeslagen dashboardsessies heeft.
    - Op desktopbreedtes blijven chatbedieningselementen op één compacte rij staan en klappen ze in tijdens omlaag scrollen door het transcript; omhoog scrollen, terugkeren naar de bovenkant of de onderkant bereiken herstelt de bedieningselementen.
    - Opeenvolgende dubbele berichten met alleen tekst worden gerenderd als één ballon met een aantalsbadge. Berichten met afbeeldingen, bijlagen, tooluitvoer of canvaspreviews blijven niet-ingeklapt.
    - De model- en denkmoduskeuzelijsten in de chatheader patchen de actieve sessie onmiddellijk via `sessions.patch`; het zijn persistente sessie-overrides, geen verzendopties voor slechts één beurt.
    - Als je een bericht verzendt terwijl een wijziging in de modelkeuzelijst voor dezelfde sessie nog wordt opgeslagen, wacht de composer op die sessiepatch voordat `chat.send` wordt aangeroepen, zodat de verzending het geselecteerde model gebruikt.
    - Het typen van `/new` in de Control UI maakt dezelfde nieuwe dashboardsessie aan als Nieuwe chat en schakelt daarnaartoe, behalve wanneer `session.dmScope: "main"` is geconfigureerd en de huidige parent de hoofdsessie van de agent is; in dat geval wordt de hoofdsessie ter plekke gereset. Het typen van `/reset` behoudt de expliciete in-place reset van de Gateway voor de huidige sessie.
    - De chatmodelkeuzelijst vraagt de geconfigureerde modelweergave van de Gateway op. Als `agents.defaults.models` aanwezig is, stuurt die allowlist de keuzelijst aan, inclusief `provider/*`-items die provider-gescopete catalogi dynamisch houden. Anders toont de keuzelijst expliciete `models.providers.*.models`-items plus providers met bruikbare auth. De volledige catalogus blijft beschikbaar via de debug-`models.list`-RPC met `view: "all"`.
    - Wanneer verse Gateway-sessiegebruikrapporten actuele contexttokens bevatten, toont de chatcomposer-werkbalk een kleine contextgebruiksring met het gebruikte percentage; de volledige tokendetails staan in de tooltip. De ring schakelt over naar waarschuwingsstijl bij hoge contextdruk en toont, bij aanbevolen Compaction-niveaus, een compacte knop die het normale sessie-Compaction-pad uitvoert. Verouderde tokensnapshots worden verborgen totdat de Gateway opnieuw vers gebruik rapporteert.

  </Accordion>
  <Accordion title="Praatmodus (browser realtime)">
    Praatmodus gebruikt een geregistreerde realtime spraakprovider. Configureer OpenAI met `talk.realtime.provider: "openai"` plus een `openai` API-sleutel-authprofiel, `talk.realtime.providers.openai.apiKey` of `OPENAI_API_KEY`; OpenAI OAuth-profielen configureren geen Realtime-spraak. Configureer Google met `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey`. De browser ontvangt nooit een standaard provider-API-sleutel. OpenAI ontvangt een vluchtig Realtime-clientgeheim voor WebRTC. Google Live ontvangt een eenmalig beperkt Live API-auth-token voor een browser-WebSocket-sessie, waarbij instructies en tooldeclaraties door de Gateway in het token zijn vergrendeld. Providers die alleen een backend realtime bridge aanbieden, lopen via het Gateway-relaytransport, zodat referenties en vendor-sockets server-side blijven terwijl browseraudio via geauthenticeerde Gateway-RPC's beweegt. De Realtime-sessieprompt wordt samengesteld door de Gateway; `talk.client.create` accepteert geen door de caller aangeleverde instructie-overrides.

    De Chat-composer bevat een knop Praatopties naast de start-/stopknop voor Praat. De opties zijn van toepassing op de volgende Praat-sessie en kunnen provider, transport, model, stem, redeneerinspanning, VAD-drempel, stilteduur en prefixpadding overschrijven. Wanneer een optie leeg is, gebruikt de Gateway geconfigureerde standaarden waar beschikbaar of de providerstandaard. Het selecteren van Gateway-relay forceert het backend-relaypad; het selecteren van WebRTC houdt de sessie client-owned en faalt in plaats van stilzwijgend terug te vallen op relay als de provider geen browsersessie kan maken.

    In de Chat-composer is de Praat-bediening de golfknop naast de microfoondictatieknop. Wanneer Praat start, toont de composer-statusrij `Connecting Talk...`, daarna `Talk live` terwijl audio is verbonden, of `Asking OpenClaw...` terwijl een realtime tool-call het geconfigureerde grotere model raadpleegt via `talk.client.toolCall`.

    Maintainer live smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifieert de OpenAI backend WebSocket-bridge, OpenAI browser WebRTC SDP-uitwisseling, Google Live constrained-token browser WebSocket-setup en de Gateway-relay browseradapter met nep-microfoonmedia. De opdracht print alleen providerstatus en logt geen secrets.

  </Accordion>
  <Accordion title="Stoppen en afbreken">
    - Klik op **Stop** (roept `chat.abort` aan).
    - Terwijl een run actief is, worden normale vervolgberichten in de wachtrij gezet. Klik op **Sturen** bij een bericht in de wachtrij om dat vervolgbericht in de lopende beurt te injecteren.
    - Typ `/stop` (of losse afbreekzinnen zoals `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) om out-of-band af te breken.
    - `chat.abort` ondersteunt `{ sessionKey }` (geen `runId`) om alle actieve runs voor die sessie af te breken.

  </Accordion>
  <Accordion title="Behoud van gedeeltelijke inhoud na afbreken">
    - Wanneer een run wordt afgebroken, kan gedeeltelijke assistenttekst nog steeds in de UI worden getoond.
    - Gateway bewaart afgebroken gedeeltelijke assistenttekst in de transcriptgeschiedenis wanneer gebufferde uitvoer bestaat.
    - Bewaarde items bevatten afbreekmetadata, zodat transcriptconsumenten gedeeltelijke afbreekuitvoer kunnen onderscheiden van normale voltooiingsuitvoer.

  </Accordion>
</AccordionGroup>

## PWA-installatie en webpush

De Control UI levert een `manifest.webmanifest` en een service worker, zodat moderne browsers deze als zelfstandige PWA kunnen installeren. Web Push laat de Gateway de geïnstalleerde PWA wekken met meldingen, zelfs wanneer het tabblad of browservenster niet open is.

Als de pagina direct na een OpenClaw-update **Protocol mismatch** toont, open dan eerst het dashboard opnieuw met `openclaw dashboard` en voer een harde refresh van de pagina uit. Als het nog steeds faalt, wis dan de sitegegevens voor de dashboard-origin of test in een privévenster; een oud tabblad of de service-workercache van de browser kan een Control UI-bundel van vóór de update blijven uitvoeren tegen de nieuwere Gateway.

| Oppervlak                                             | Wat het doet                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA-manifest. Browsers bieden "Install app" aan zodra het bereikbaar is. |
| `ui/public/sw.js`                                     | Service worker die `push`-events en notificatieklikken afhandelt. |
| `push/vapid-keys.json` (onder de OpenClaw state-dir) | Automatisch gegenereerd VAPID-sleutelpaar dat wordt gebruikt om Web Push-payloads te ondertekenen. |
| `push/web-push-subscriptions.json`                    | Persistente browserabonnement-endpoints.                          |

Overschrijf het VAPID-sleutelpaar via env-vars op het Gateway-proces wanneer je sleutels wilt vastpinnen (voor multi-host deployments, geheimrotatie of tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (standaard `https://openclaw.ai`)

De Control UI gebruikt deze scope-gated Gateway-methoden om browserabonnementen te registreren en te testen:

- `push.web.vapidPublicKey` — haalt de actieve publieke VAPID-sleutel op.
- `push.web.subscribe` — registreert een `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — verwijdert een geregistreerd endpoint.
- `push.web.test` — stuurt een testnotificatie naar het abonnement van de aanroeper.

<Note>
Web Push staat los van het iOS APNS-relaypad (zie [Configuratie](/nl/gateway/configuration) voor relay-ondersteunde push) en de bestaande methode `push.test`, die zijn gericht op native mobiele koppeling.
</Note>

## Gehoste embeds

Assistentberichten kunnen gehoste webinhoud inline renderen met de `[embed ...]`-shortcode. Het iframe-sandboxbeleid wordt beheerd door `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Schakelt scriptuitvoering binnen gehoste embeds uit.
  </Tab>
  <Tab title="scripts (default)">
    Staat interactieve embeds toe terwijl origin-isolatie behouden blijft; dit is de standaard en is meestal genoeg voor zelfstandige browsergames/widgets.
  </Tab>
  <Tab title="trusted">
    Voegt `allow-same-origin` toe boven op `allow-scripts` voor same-site-documenten die bewust sterkere privileges nodig hebben.
  </Tab>
</Tabs>

Voorbeeld:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

<Warning>
Gebruik `trusted` alleen wanneer het ingesloten document echt same-origin-gedrag nodig heeft. Voor de meeste door agents gegenereerde games en interactieve canvassen is `scripts` de veiligere keuze.
</Warning>

Absolute externe `http(s)`-embed-URL's blijven standaard geblokkeerd. Als je bewust wilt dat `[embed url="https://..."]` pagina's van derden laadt, stel dan `gateway.controlUi.allowExternalEmbedUrls: true` in.

## Breedte van chatberichten

Gegroepeerde chatberichten gebruiken een leesbare standaard maximale breedte. Deployments met brede monitoren kunnen dit overschrijven zonder gebundelde CSS te patchen door `gateway.controlUi.chatMessageMaxWidth` in te stellen:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

De waarde wordt gevalideerd voordat deze de browser bereikt. Ondersteunde waarden omvatten gewone lengtes en percentages zoals `960px` of `82%`, plus begrensde breedte-expressies met `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` en `fit-content(...)`.

## Tailnet-toegang (aanbevolen)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Houd de Gateway op loopback en laat Tailscale Serve deze via HTTPS proxien:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Open:

    - `https://<magicdns>/` (of je geconfigureerde `gateway.controlUi.basePath`)

    Standaard kunnen Control UI/WebSocket Serve-aanvragen authenticeren via Tailscale-identiteitsheaders (`tailscale-user-login`) wanneer `gateway.auth.allowTailscale` `true` is. OpenClaw verifieert de identiteit door het `x-forwarded-for`-adres op te lossen met `tailscale whois` en dit te matchen met de header, en accepteert deze alleen wanneer de aanvraag loopback raakt met Tailscale's `x-forwarded-*`-headers. Voor Control UI-operatorsessies met browserapparaatidentiteit slaat dit geverifieerde Serve-pad ook de device-pairing-roundtrip over; browsers zonder apparaat en verbindingen met node-rol volgen nog steeds de normale apparaatcontroles. Stel `gateway.auth.allowTailscale: false` in als je expliciete shared-secret-credentials wilt vereisen, zelfs voor Serve-verkeer. Gebruik dan `gateway.auth.mode: "token"` of `"password"`.

    Voor dat asynchrone Serve-identiteitspad worden mislukte authenticatiepogingen voor hetzelfde client-IP en dezelfde auth-scope geserialiseerd voordat rate-limit-writes plaatsvinden. Gelijktijdige slechte retries vanuit dezelfde browser kunnen daarom `retry later` tonen op de tweede aanvraag in plaats van twee gewone mismatches die parallel racen.

    <Warning>
    Tokenloze Serve-authenticatie gaat ervan uit dat de gateway-host vertrouwd is. Als onvertrouwde lokale code op die host kan draaien, vereis dan token-/wachtwoordauthenticatie.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Open vervolgens:

    - `http://<tailscale-ip>:18789/` (of je geconfigureerde `gateway.controlUi.basePath`)

    Plak het bijbehorende gedeelde geheim in de UI-instellingen (verzonden als `connect.params.auth.token` of `connect.params.auth.password`).

  </Tab>
</Tabs>

## Onveilige HTTP

Als je het dashboard opent via gewone HTTP (`http://<lan-ip>` of `http://<tailscale-ip>`), draait de browser in een **niet-beveiligde context** en blokkeert WebCrypto. Standaard **blokkeert** OpenClaw Control UI-verbindingen zonder apparaatidentiteit.

Gedocumenteerde uitzonderingen:

- localhost-only onveilige HTTP-compatibiliteit met `gateway.controlUi.allowInsecureAuth=true`
- succesvolle operator-Control UI-authenticatie via `gateway.auth.mode: "trusted-proxy"`
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Aanbevolen oplossing:** gebruik HTTPS (Tailscale Serve) of open de UI lokaal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (op de gateway-host)

<AccordionGroup>
  <Accordion title="Insecure-auth toggle behavior">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` is alleen een lokale compatibiliteitstoggle:

    - Hiermee kunnen localhost-Control UI-sessies doorgaan zonder apparaatidentiteit in niet-beveiligde HTTP-contexten.
    - Het omzeilt geen koppelingscontroles.
    - Het versoepelt geen apparaatidentiteitsvereisten voor externe (niet-localhost) verbindingen.

  </Accordion>
  <Accordion title="Break-glass only">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth` schakelt apparaatidentiteitscontroles van de Control UI uit en is een ernstige beveiligingsverlaging. Draai dit snel terug na noodgebruik.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Succesvolle trusted-proxy-authenticatie kan **operator**-Control UI-sessies zonder apparaatidentiteit toelaten.
    - Dit geldt **niet** voor Control UI-sessies met node-rol.
    - Same-host loopback reverse proxies voldoen nog steeds niet aan trusted-proxy-authenticatie; zie [Trusted proxy-authenticatie](/nl/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Zie [Tailscale](/nl/gateway/tailscale) voor HTTPS-installatiebegeleiding.

## Content security policy

De Control UI wordt geleverd met een strak `img-src`-beleid: alleen assets met **same-origin**, `data:`-URL's en lokaal gegenereerde `blob:`-URL's zijn toegestaan. Externe `http(s)`- en protocol-relative afbeeldings-URL's worden door de browser geweigerd en veroorzaken geen netwerkfetches.

Wat dit in de praktijk betekent:

- Avatars en afbeeldingen die onder relatieve paden worden aangeboden (bijvoorbeeld `/avatars/<id>`) worden nog steeds gerenderd, inclusief geauthenticeerde avatarroutes die de UI ophaalt en omzet naar lokale `blob:`-URL's.
- Inline `data:image/...`-URL's worden nog steeds gerenderd (nuttig voor in-protocol payloads).
- Lokale `blob:`-URL's die door de Control UI zijn gemaakt, worden nog steeds gerenderd.
- Externe avatar-URL's die door kanaalmetadata worden uitgegeven, worden gestript in de avatarhelpers van de Control UI en vervangen door het ingebouwde logo/de badge, zodat een gecompromitteerd of kwaadaardig kanaal geen willekeurige externe afbeeldingsfetches vanuit de browser van een operator kan afdwingen.

Je hoeft niets te wijzigen om dit gedrag te krijgen — het staat altijd aan en is niet configureerbaar.

## Authenticatie voor avatarroute

Wanneer gateway-authenticatie is geconfigureerd, vereist het avatarendpoint van de Control UI dezelfde gateway-token als de rest van de API:

- `GET /avatar/<agentId>` retourneert de avatarafbeelding alleen aan geauthenticeerde aanroepers. `GET /avatar/<agentId>?meta=1` retourneert de avatarmetadata onder dezelfde regel.
- Niet-geauthenticeerde aanvragen naar een van beide routes worden geweigerd (overeenkomstig de sibling assistant-media-route). Dit voorkomt dat de avatarroute agentidentiteit lekt op hosts die verder beschermd zijn.
- De Control UI zelf stuurt de gateway-token door als bearer-header bij het ophalen van avatars, en gebruikt geauthenticeerde blob-URL's zodat de afbeelding nog steeds in dashboards wordt gerenderd.

Als je gateway-authenticatie uitschakelt (niet aanbevolen op gedeelde hosts), wordt de avatarroute ook niet-geauthenticeerd, in lijn met de rest van de gateway.

## Authenticatie voor assistant-media-route

Wanneer gateway-authenticatie is geconfigureerd, gebruiken lokale-mediavoorbeelden van de assistent een tweestapsroute:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` vereist de normale Control UI-operatorauthenticatie. De browser verzendt de gateway-token als bearer-header bij het controleren van beschikbaarheid.
- Succesvolle metadataresponses bevatten een kortlevende `mediaTicket` die is gescoped op dat exacte bronpad.
- Door de browser gerenderde URL's voor afbeeldingen, audio, video en documenten gebruiken `mediaTicket=<ticket>` in plaats van de actieve gateway-token of het wachtwoord. Het ticket verloopt snel en kan geen andere bron autoriseren.

Dit houdt normale mediarendering compatibel met browser-native media-elementen zonder herbruikbare gateway-credentials in zichtbare media-URL's te plaatsen.

## De UI bouwen

De Gateway serveert statische bestanden vanuit `dist/control-ui`. Bouw ze met:

```bash
pnpm ui:build
```

Optionele absolute basis (wanneer je vaste asset-URL's wilt):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Voor lokale ontwikkeling (aparte dev-server):

```bash
pnpm ui:dev
```

Wijs de UI vervolgens naar je Gateway WS-URL (bijv. `ws://127.0.0.1:18789`).

## Lege Control UI-pagina

Als de browser een leeg dashboard laadt en DevTools geen bruikbare fout toont, kan een extensie of vroeg content script hebben voorkomen dat de JavaScript-module-app wordt geëvalueerd. De statische pagina bevat een eenvoudig HTML-herstelpaneel dat verschijnt wanneer `<openclaw-app>` na het opstarten niet is geregistreerd.

Gebruik de actie **Opnieuw proberen** van het paneel nadat je de browseromgeving hebt gewijzigd, of herlaad handmatig na deze controles:

- Schakel extensies uit die in alle pagina's injecteren, vooral extensies met `<all_urls>` content scripts.
- Probeer een privévenster, een schoon browserprofiel of een andere browser.
- Houd de Gateway actief en verifieer dezelfde dashboard-URL na de browserwijziging.

## Debuggen/testen: dev-server + externe Gateway

De Control UI bestaat uit statische bestanden; het WebSocket-doel is configureerbaar en kan verschillen van de HTTP-origin. Dit is handig wanneer je de Vite-dev-server lokaal wilt gebruiken maar de Gateway elders draait.

<Steps>
  <Step title="Start the UI dev server">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Open with gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    Optionele eenmalige authenticatie (indien nodig):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notities">
    - `gatewayUrl` wordt na het laden opgeslagen in localStorage en uit de URL verwijderd.
    - Als je een volledig `ws://`- of `wss://`-endpoint via `gatewayUrl` doorgeeft, URL-codeer dan de waarde van `gatewayUrl` zodat de browser de queryreeks correct parseert.
    - `token` moet waar mogelijk via het URL-fragment (`#token=...`) worden doorgegeven. Fragmenten worden niet naar de server verzonden, waardoor lekkage via aanvraaglogs en Referer wordt voorkomen. Verouderde `?token=`-queryparameters worden voor compatibiliteit nog steeds eenmalig geïmporteerd, maar alleen als fallback, en worden direct na bootstrap verwijderd.
    - `password` wordt alleen in het geheugen bewaard.
    - Wanneer `gatewayUrl` is ingesteld, valt de UI niet terug op configuratie- of omgevingsreferenties. Geef `token` (of `password`) expliciet op. Ontbrekende expliciete referenties zijn een fout.
    - Gebruik `wss://` wanneer de Gateway achter TLS staat (Tailscale Serve, HTTPS-proxy, enz.).
    - `gatewayUrl` wordt alleen geaccepteerd in een venster op het hoogste niveau (niet ingesloten) om clickjacking te voorkomen.
    - Publieke niet-loopback Control UI-implementaties moeten `gateway.controlUi.allowedOrigins` expliciet instellen (volledige origins). Privé same-origin LAN/Tailnet-ladingen vanaf loopback-, RFC1918/link-local-, `.local`-, `.ts.net`- of Tailscale CGNAT-hosts worden geaccepteerd zonder Host-header-fallback in te schakelen.
    - Het opstarten van de Gateway kan lokale origins zoals `http://localhost:<port>` en `http://127.0.0.1:<port>` seeden vanuit de effectieve runtime-bind en poort, maar externe browser-origins hebben nog steeds expliciete vermeldingen nodig.
    - Gebruik `gateway.controlUi.allowedOrigins: ["*"]` niet, behalve voor strak gecontroleerde lokale tests. Het betekent elke browser-origin toestaan, niet "overeenkomen met welke host ik ook gebruik."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` schakelt de Host-header-origin-fallbackmodus in, maar dit is een gevaarlijke beveiligingsmodus.

  </Accordion>
</AccordionGroup>

Voorbeeld:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Details voor externe toegang instellen: [Externe toegang](/nl/gateway/remote).

## Gerelateerd

- [Dashboard](/nl/web/dashboard) — Gateway-dashboard
- [Statuscontroles](/nl/gateway/health) — bewaking van Gateway-status
- [TUI](/nl/web/tui) — terminalgebruikersinterface
- [WebChat](/nl/web/webchat) — browsergebaseerde chatinterface
