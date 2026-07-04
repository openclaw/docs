---
read_when:
    - Je wilt de Gateway bedienen vanuit een browser
    - Je wilt Tailnet-toegang zonder SSH-tunnels
sidebarTitle: Control UI
summary: Browsergebaseerde bedienings-UI voor de Gateway (chat, activiteit, knooppunten, configuratie)
title: Bedienings-UI
x-i18n:
    generated_at: "2026-07-04T18:09:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00575a4633b192b6121145476c3b15b6b68cfd177322f409cacbb7ef331d09d
    source_path: web/control-ui.md
    workflow: 16
---

De Control UI is een kleine **Vite + Lit** single-page app die door de Gateway wordt geserveerd:

- standaard: `http://<host>:18789/`
- optioneel voorvoegsel: stel `gateway.controlUi.basePath` in (bijv. `/openclaw`)

Deze communiceert **rechtstreeks met de Gateway WebSocket** op dezelfde poort.

## Snel openen (lokaal)

Als de Gateway op dezelfde computer draait, open dan:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (of [http://localhost:18789/](http://localhost:18789/))

Als de pagina niet laadt, start dan eerst de Gateway: `openclaw gateway`.

<Note>
Bij native Windows-LAN-bindingen kan Windows Firewall of door de organisatie beheerd Groepsbeleid de geadverteerde LAN-URL nog steeds blokkeren, zelfs wanneer `127.0.0.1` werkt op de Gateway-host. Voer `openclaw gateway status --deep` uit op de Windows-host; dit rapporteert waarschijnlijk geblokkeerde poorten, profielmismatches en lokale firewallregels die beleid mogelijk negeert.
</Note>

Authenticatie wordt tijdens de WebSocket-handshake geleverd via:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve-identiteitsheaders wanneer `gateway.auth.allowTailscale: true`
- vertrouwde-proxy-identiteitsheaders wanneer `gateway.auth.mode: "trusted-proxy"`

Het instellingenpaneel van het dashboard bewaart een token voor de huidige browsertabsessie en de geselecteerde gateway-URL; wachtwoorden worden niet opgeslagen. Onboarding genereert meestal een gateway-token voor gedeelde-geheim-authenticatie bij de eerste verbinding, maar wachtwoordauthenticatie werkt ook wanneer `gateway.auth.mode` `"password"` is.

## Apparaat koppelen (eerste verbinding)

Wanneer je vanuit een nieuwe browser of vanaf een nieuw apparaat verbinding maakt met de Control UI, vereist de Gateway meestal een **eenmalige koppelingsgoedkeuring**. Dit is een beveiligingsmaatregel om onbevoegde toegang te voorkomen.

**Wat je ziet:** "disconnected (1008): pairing required"

<Steps>
  <Step title="Openstaande verzoeken weergeven">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Goedkeuren op verzoek-ID">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Als de browser opnieuw probeert te koppelen met gewijzigde authenticatiegegevens (rol/scopes/openbare sleutel), wordt het vorige openstaande verzoek vervangen en wordt er een nieuwe `requestId` gemaakt. Voer `openclaw devices list` opnieuw uit vóór goedkeuring.

Als de browser al gekoppeld is en je deze wijzigt van leestoegang naar schrijf-/beheerderstoegang, wordt dit behandeld als een goedkeuringsupgrade, niet als een stille herverbinding. OpenClaw houdt de oude goedkeuring actief, blokkeert de bredere herverbinding en vraagt je om de nieuwe scopeset expliciet goed te keuren.

Na goedkeuring wordt het apparaat onthouden en is er geen nieuwe goedkeuring nodig, tenzij je het intrekt met `openclaw devices revoke --device <id> --role <role>`. Zie [Devices CLI](/nl/cli/devices) voor tokenrotatie en intrekking.

Paperclip-agenten die verbinding maken via de `openclaw_gateway`-adapter gebruiken dezelfde goedkeuringsstroom bij de eerste uitvoering. Voer na de eerste verbindingspoging `openclaw devices approve --latest` uit om het openstaande verzoek te bekijken en voer daarna de afgedrukte opdracht `openclaw devices approve <requestId>` opnieuw uit om het goed te keuren. Geef expliciete `--url`- en `--token`-waarden door voor een externe gateway. Configureer in Paperclip een permanente `adapterConfig.devicePrivateKeyPem` in plaats van bij elke uitvoering een nieuwe tijdelijke apparaatidentiteit te laten genereren, zodat goedkeuringen stabiel blijven na herstarts.

<Note>
- Directe lokale local loopback-browserverbindingen (`127.0.0.1` / `localhost`) worden automatisch goedgekeurd.
- Tailscale Serve kan de koppelingsronde overslaan voor Control UI-operatorsessies wanneer `gateway.auth.allowTailscale: true`, de Tailscale-identiteit is geverifieerd en de browser zijn apparaatidentiteit presenteert.
- Directe Tailnet-bindingen, LAN-browserverbindingen en browserprofielen zonder apparaatidentiteit vereisen nog steeds expliciete goedkeuring.
- Elk browserprofiel genereert een unieke apparaat-ID, dus wisselen van browser of wissen van browsergegevens vereist opnieuw koppelen.

</Note>

## Een mobiel apparaat koppelen

Een al gekoppelde beheerder kan de iOS/Android-verbindings-QR maken zonder
een terminal te openen:

<Steps>
  <Step title="Mobiel koppelen openen">
    Selecteer **Knooppunten** en klik vervolgens op **Mobiel apparaat koppelen** in de kaart **Apparaten**.
  </Step>
  <Step title="De telefoon verbinden">
    Open in de mobiele OpenClaw-app **Instellingen** → **Gateway** en scan de QR-
    code. Je kunt in plaats daarvan de installatiecode kopiëren en plakken.
  </Step>
  <Step title="De verbinding bevestigen">
    De officiële iOS/Android-app maakt automatisch verbinding. Als **Apparaten** een
    openstaand verzoek toont, controleer dan de rol en scopes voordat je het goedkeurt.
  </Step>
</Steps>

Voor het maken van een installatiecode is `operator.admin` vereist; de knop is uitgeschakeld voor
sessies zonder die permissie. Een installatiecode bevat een kortlevende bootstrapreferentie,
dus behandel de QR en de gekopieerde code als een wachtwoord zolang ze geldig zijn. Voor externe
koppeling moet de Gateway naar `wss://` verwijzen (bijvoorbeeld via Tailscale
Serve/Funnel); gewone `ws://` is beperkt tot loopback- en privé-LAN-adressen.
Zie [Koppelen](/nl/channels/pairing#pair-from-the-control-ui-recommended) voor de
volledige beveiligings- en fallbackdetails.

## Persoonlijke identiteit (browserlokaal)

De Control UI ondersteunt een persoonlijke identiteit per browser (weergavenaam en avatar) die aan uitgaande berichten wordt gekoppeld voor attributie in gedeelde sessies. Deze leeft in browseropslag, is beperkt tot het huidige browserprofiel en wordt niet gesynchroniseerd naar andere apparaten of server-side opgeslagen buiten de normale transcript-auteurschapsmetadata op berichten die je daadwerkelijk verzendt. Het wissen van sitegegevens of wisselen van browser zet deze terug naar leeg.

Hetzelfde browserlokale patroon geldt voor de override van de assistentavatar. Geüploade assistentavatars leggen de door de gateway opgeloste identiteit alleen over de lokale browser heen en maken nooit een roundtrip via `config.patch`. Het gedeelde configuratieveld `ui.assistant.avatar` blijft beschikbaar voor niet-UI-clients die het veld rechtstreeks schrijven (zoals gescripte gateways of aangepaste dashboards).

## Runtimeconfiguratie-eindpunt

De Control UI haalt zijn runtime-instellingen op uit `/control-ui-config.json`, opgelost relatief ten opzichte van het Control UI-basispad van de gateway (bijvoorbeeld `/__openclaw__/control-ui-config.json` wanneer de UI onder `/__openclaw__/` wordt geserveerd). Dat eindpunt wordt afgeschermd door dezelfde gateway-authenticatie als de rest van het HTTP-oppervlak: niet-geauthenticeerde browsers kunnen het niet ophalen, en een succesvolle fetch vereist een al geldig gateway-token/wachtwoord, Tailscale Serve-identiteit of een vertrouwde-proxy-identiteit.

## Taalondersteuning

De Control UI kan zichzelf bij de eerste laadbeurt lokaliseren op basis van je browserlocale. Om dit later te wijzigen, open je **Overzicht -> Gateway-toegang -> Taal**. De locale-kiezer staat in de kaart Gateway-toegang, niet onder Uiterlijk.

- Ondersteunde locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Niet-Engelse vertalingen worden lazy-loaded in de browser.
- De geselecteerde locale wordt opgeslagen in browseropslag en hergebruikt bij toekomstige bezoeken.
- Ontbrekende vertaalsleutels vallen terug op Engels.

Docs-vertalingen worden gegenereerd voor dezelfde niet-Engelse localeset, maar de ingebouwde Mintlify-taalkiezer van de documentatiesite is beperkt tot de localecodes die Mintlify accepteert. Thaise (`th`) en Perzische (`fa`) docs worden nog steeds gegenereerd in de publicatierepo; ze verschijnen mogelijk pas in die kiezer wanneer Mintlify die codes ondersteunt.

## Uiterlijksthema's

Het paneel Uiterlijk behoudt de ingebouwde thema's Claw, Knot en Dash, plus één browserlokale tweakcn-importsleuf. Om een thema te importeren, open je de [tweakcn-editor](https://tweakcn.com/editor/theme), kies of maak je een thema, klik je op **Delen** en plak je de gekopieerde themalink in Uiterlijk. De importer accepteert ook register-URL's zoals `https://tweakcn.com/r/themes/<id>`, editor-URL's zoals `https://tweakcn.com/editor/theme?theme=amethyst-haze`, relatieve `/themes/<id>`-paden, ruwe thema-ID's en standaardthemanamen zoals `amethyst-haze`.

Uiterlijk bevat ook een browserlokale instelling voor tekstgrootte. De instelling wordt opgeslagen met de rest van de Control UI-voorkeuren, is van toepassing op chattekst, composer-tekst, toolkaarten en chatzijbalken, en houdt tekstinvoer minimaal 16px zodat mobiele Safari niet automatisch inzoomt bij focus.

Geïmporteerde thema's worden alleen opgeslagen in het huidige browserprofiel. Ze worden niet naar gatewayconfiguratie geschreven en synchroniseren niet tussen apparaten. Het vervangen van het geïmporteerde thema werkt de ene lokale sleuf bij; wissen schakelt het actieve thema terug naar Claw als het geïmporteerde thema was geselecteerd.

## Wat het kan doen (vandaag)

<AccordionGroup>
  <Accordion title="Chat en spraak">
    - Chat met het model via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Vernieuwingen van chatgeschiedenis vragen een begrensd recent venster op met tekstlimieten per bericht, zodat grote sessies de browser niet dwingen een volledige transcriptpayload te renderen voordat de chat bruikbaar wordt.
    - Praat via realtime browsersessies. OpenAI gebruikt directe WebRTC, Google Live gebruikt een beperkt eenmalig browsertoken via WebSocket, en realtime spraakplugins die alleen via de backend werken gebruiken het Gateway-relaytransport. Client-eigen providersessies starten met `talk.client.create`; Gateway-relaysessies starten met `talk.session.create`. De relay houdt providerreferenties op de Gateway terwijl de browser microfoon-PCM streamt via `talk.session.appendAudio`, provider-toolcalls van `openclaw_agent_consult` doorstuurt via `talk.client.toolCall` voor Gateway-beleid en het grotere geconfigureerde OpenClaw-model, en spraaksturing van actieve runs routeert via `talk.client.steer` of `talk.session.steer`.
    - Stream toolcalls en live tooluitvoerkaarten in Chat (agentgebeurtenissen).
    - Activiteitstabblad met browserlokale, redacties-eerst samenvattingen van live toolactiviteit uit bestaande `session.tool` / toolgebeurtenislevering.

  </Accordion>
  <Accordion title="Kanalen, instanties, sessies, dromen">
    - Kanalen: ingebouwde plus gebundelde/externe Plugin-kanaalstatus, QR-login en configuratie per kanaal (`channels.status`, `web.login.*`, `config.patch`).
    - Vernieuwingen van kanaalprobes houden de vorige snapshot zichtbaar terwijl trage providercontroles worden afgerond, en deelsnapshots worden gelabeld wanneer een probe of audit zijn UI-budget overschrijdt.
    - Instanties: aanwezigheidslijst + vernieuwen (`system-presence`).
    - Sessies: toon standaard sessies van geconfigureerde agenten, val terug vanaf verouderde ongeconfigureerde agentsessiesleutels, en pas model-/thinking-/fast-/verbose-/trace-/reasoning-overrides per sessie toe (`sessions.list`, `sessions.patch`).
    - Dromen: Dreaming-status, schakelaar voor inschakelen/uitschakelen en Dream Diary-lezer (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, knooppunten, exec-goedkeuringen">
    - Cron-taken: weergeven/toevoegen/bewerken/uitvoeren/inschakelen/uitschakelen + uitvoergeschiedenis (`cron.*`).
    - Skills: status, inschakelen/uitschakelen, installeren, API-sleutelupdates (`skills.*`).
    - Knooppunten: lijst + mogelijkheden (`node.list`), mobiele installatiecodes maken en apparaatkoppeling goedkeuren (`device.pair.*`).
    - Exec-goedkeuringen: gateway- of knooppunt-allowlists bewerken + vraagbeleid voor `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuratie">
    - Bekijk/bewerk `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP heeft een speciale instellingenpagina voor geconfigureerde servers, inschakeling, OAuth-/filter-/parallelle samenvattingen, algemene operatoropdrachten en de beperkte `mcp`-configuratie-editor.
    - Pas toe + herstart met validatie (`config.apply`) en wek de laatst actieve sessie.
    - Schrijfacties bevatten een base-hash-bescherming om overschrijven van gelijktijdige bewerkingen te voorkomen.
    - Schrijfacties (`config.set`/`config.apply`/`config.patch`) voeren vooraf actieve SecretRef-resolutie uit voor refs in de ingediende configuratiepayload; niet-opgeloste actieve ingediende refs worden vóór het schrijven geweigerd.
    - Formulieropslagacties verwijderen verouderde geredigeerde placeholders die niet vanuit de opgeslagen configuratie kunnen worden hersteld, terwijl geredigeerde waarden behouden blijven die nog steeds aan opgeslagen geheimen zijn gekoppeld.
    - Schema + formulierweergave (`config.schema` / `config.schema.lookup`, inclusief veld `title` / `description`, overeenkomende UI-hints, directe kindsamenvattingen, docsmetadata op geneste object-/wildcard-/array-/compositieknooppunten, plus Plugin- + kanaalschema's indien beschikbaar); de Raw JSON-editor is alleen beschikbaar wanneer de snapshot een veilige onbewerkte roundtrip heeft.
    - Als een snapshot onbewerkte tekst niet veilig kan roundtrippen, dwingt Control UI de formuliermodus af en schakelt het de Raw-modus voor die snapshot uit.
    - De Raw JSON-editor "Terugzetten naar opgeslagen" behoudt de onbewerkt aangemaakte vorm (opmaak, opmerkingen, `$include`-indeling) in plaats van een afgevlakte snapshot opnieuw te renderen, zodat externe bewerkingen een reset overleven wanneer de snapshot veilig kan roundtrippen.
    - Gestructureerde SecretRef-objectwaarden worden alleen-lezen weergegeven in formuliertekstinvoer om onbedoelde corruptie van object naar string te voorkomen.

  </Accordion>
  <Accordion title="Debuggen, logs, update">
    - Debuggen: status-/gezondheids-/modellen-snapshots + gebeurtenislog + handmatige RPC-aanroepen (`status`, `health`, `models.list`).
    - Het gebeurtenislog bevat vernieuwings-/RPC-timings van Control UI, timings voor trage chat-/configuratieweergave en browserresponsiviteitsvermeldingen voor lange animatieframes of lange taken wanneer de browser die PerformanceObserver-vermeldingstypen beschikbaar maakt.
    - Logs: live tail van Gateway-bestandslogs met filter/export (`logs.tail`).
    - Update: voer een pakket-/git-update + herstart uit (`update.run`) met een herstartrapport en poll daarna `update.status` na opnieuw verbinden om de draaiende Gateway-versie te verifiëren.

  </Accordion>
  <Accordion title="Opmerkingen bij het Cron-takenpaneel">
    - Voor geïsoleerde taken is de standaardlevering een aankondigingssamenvatting. Je kunt overschakelen naar geen als je alleen interne runs wilt.
    - Kanaal-/doelvelden verschijnen wanneer aankondigen is geselecteerd.
    - Webhook-modus gebruikt `delivery.mode = "webhook"` met `delivery.to` ingesteld op een geldige HTTP(S)-Webhook-URL.
    - Voor taken in de hoofdsessie zijn Webhook- en geen-leveringsmodi beschikbaar.
    - Geavanceerde bewerkingsknoppen bevatten verwijderen-na-run, agent-override wissen, exacte/gespreide cron-opties, overrides voor agentmodel/denken en best-effort-leveringsschakelaars.
    - Formuliervalidatie gebeurt inline met fouten op veldniveau; ongeldige waarden schakelen de opslagknop uit totdat ze zijn opgelost.
    - Stel `cron.webhookToken` in om een speciale bearer-token te verzenden; indien weggelaten wordt de Webhook zonder auth-header verzonden.
    - Verouderde fallback: voer `openclaw doctor --fix` uit om opgeslagen legacytaken met `notify: true` te migreren van `cron.webhook` naar expliciete Webhook- of voltooiingslevering per taak.

  </Accordion>
</AccordionGroup>

## MCP-pagina

De speciale MCP-pagina is een operatorweergave voor door OpenClaw beheerde MCP-servers onder `mcp.servers`. Deze start zelf geen MCP-transports; gebruik de pagina om opgeslagen configuratie te inspecteren en te bewerken, en gebruik daarna `openclaw mcp doctor --probe` wanneer je live serverbewijs nodig hebt.

Typische workflow:

1. Open **MCP** vanuit de zijbalk.
2. Controleer de samenvattingskaarten voor het totaal, ingeschakelde, OAuth- en gefilterde serveraantallen.
3. Controleer elke serverrij op transport, inschakeling, auth, filters, time-outs en opdrachthints.
4. Schakel inschakeling om wanneer een server geconfigureerd moet blijven maar buiten runtime-discovery moet blijven.
5. Bewerk de beperkte `mcp`-configuratiesectie voor serverdefinities, headers, TLS-/mTLS-paden, OAuth-metadata, toolfilters en Codex-projectiemetadata.
6. Gebruik **Opslaan** voor een configuratieschrijfactie, of **Opslaan en publiceren** wanneer de draaiende Gateway de gewijzigde configuratie moet toepassen.
7. Voer `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` of `openclaw mcp reload` uit vanuit een terminal wanneer het bewerkte proces statische diagnostiek, live bewijs of verwijdering van gecachte runtime nodig heeft.

De pagina redigeert URL-achtige waarden met credentials voordat ze worden weergegeven en zet servernamen tussen aanhalingstekens in opdrachtsnippets, zodat gekopieerde opdrachten nog steeds werken met spaties of shell-metatekens. De volledige CLI- en configuratiereferentie staat in [MCP](/nl/cli/mcp).

## Activiteitstabblad

Het Activiteitstabblad is een tijdelijke browserlokale observator voor live toolactiviteit. Het is afgeleid van dezelfde Gateway-`session.tool` / toolgebeurtenisstroom die Chat-toolkaarten aandrijft; het voegt geen andere Gateway-gebeurtenisfamilie, endpoint, duurzame activiteitenopslag, metrics-feed of externe observatorstroom toe.

Activiteitsvermeldingen bewaren alleen opgeschoonde samenvattingen en geredigeerde, ingekorte uitvoervoorbeelden. Toolargumentwaarden worden niet opgeslagen in de activiteitsstatus; de UI toont dat argumenten verborgen zijn en registreert alleen het aantal argumentvelden. De in-memory lijst volgt het huidige browsertabblad, overleeft navigatie binnen de Control UI en wordt gereset bij paginaherladen, sessiewissel of **Wissen**.

## Chatgedrag

<AccordionGroup>
  <Accordion title="Verzend- en geschiedenissemantiek">
    - `chat.send` is **niet-blokkerend**: het bevestigt onmiddellijk met `{ runId, status: "started" }` en de reactie streamt via `chat`-gebeurtenissen. Vertrouwde Control UI-clients kunnen ook optionele ACK-timingmetadata ontvangen voor lokale diagnostiek.
    - Chatuploads accepteren afbeeldingen plus niet-videobestanden. Afbeeldingen behouden het native afbeeldingspad; andere bestanden worden opgeslagen als beheerde media en in de geschiedenis getoond als bijlagelinks.
    - Opnieuw verzenden met dezelfde `idempotencyKey` retourneert `{ status: "in_flight" }` tijdens uitvoering, en `{ status: "ok" }` na voltooiing.
    - `chat.history`-reacties zijn in grootte begrensd voor UI-veiligheid. Wanneer transcriptvermeldingen te groot zijn, kan Gateway lange tekstvelden inkorten, zware metadatablokken weglaten en te grote berichten vervangen door een placeholder (`[chat.history omitted: message too large]`).
    - Wanneer een zichtbaar assistentbericht is ingekort in `chat.history`, kan de zijlezer de volledige display-genormaliseerde transcriptvermelding op aanvraag ophalen via `chat.message.get` met `sessionKey`, actieve `agentId` indien nodig, en transcript-`messageId`. Als de Gateway nog steeds niet meer kan retourneren, toont de lezer een expliciete onbeschikbaar-status in plaats van stilzwijgend de ingekorte preview te herhalen.
    - Door de assistent gegenereerde afbeeldingen worden bewaard als beheerde mediareferenties en teruggeleverd via geauthenticeerde Gateway-media-URL's, zodat herladen niet afhankelijk is van onbewerkte base64-afbeeldingspayloads die in de chatgeschiedenisreactie blijven staan.
    - Bij het renderen van `chat.history` verwijdert de Control UI inline directive-tags die alleen voor weergave zijn bedoeld uit zichtbare assistenttekst (bijvoorbeeld `[[reply_to_*]]` en `[[audio_as_voice]]`), platte-tekst tool-call XML-payloads (inclusief `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en ingekorte tool-call-blokken), en gelekte ASCII-/full-width modelcontroletokens, en laat assistentvermeldingen weg waarvan de hele zichtbare tekst alleen het exacte stille token `NO_REPLY` / `no_reply` of het Heartbeat-bevestigingstoken `HEARTBEAT_OK` is.
    - Tijdens een actieve verzending en de laatste geschiedenisvernieuwing houdt de chatweergave lokale optimistische gebruikers-/assistentberichten zichtbaar als `chat.history` kortstondig een oudere snapshot retourneert; het canonieke transcript vervangt die lokale berichten zodra de Gateway-geschiedenis is bijgewerkt.
    - Live `chat`-gebeurtenissen zijn leveringsstatus, terwijl `chat.history` opnieuw wordt opgebouwd vanuit het duurzame sessietranscript. Na tool-final-gebeurtenissen herlaadt de Control UI de geschiedenis en voegt alleen een kleine optimistische staart samen; de transcriptgrens is gedocumenteerd in [WebChat](/nl/web/webchat).
    - `chat.inject` voegt een assistentnotitie toe aan het sessietranscript en broadcast een `chat`-gebeurtenis voor alleen-UI-updates (geen agentrun, geen kanaallevering).
    - De zijbalk toont recente sessies met een actie Nieuwe sessie, een link Alle sessies en een sessiezoekknop die de volledige sessiekiezer opent (beperkt tot de geselecteerde agent, met zoeken en paginering). Bij het wisselen van agent worden alleen sessies getoond die aan die agent zijn gekoppeld, met fallback naar de hoofdsessie van die agent wanneer deze nog geen opgeslagen dashboardsessies heeft.
    - Op desktopbreedtes blijven chatknoppen op één compacte rij staan en klappen ze in tijdens omlaag scrollen door het transcript; omhoog scrollen, terugkeren naar boven of de onderkant bereiken herstelt de knoppen.
    - Opeenvolgende dubbele berichten met alleen tekst worden weergegeven als één ballon met een telbadge. Berichten met afbeeldingen, bijlagen, tooluitvoer of canvaspreviews blijven niet-ingeklapt.
    - De model- en denkkiezers in de chatheader patchen de actieve sessie onmiddellijk via `sessions.patch`; het zijn persistente sessie-overrides, geen verzendopties voor slechts één beurt.
    - Als je een bericht verzendt terwijl een wijziging in de modelkiezer voor dezelfde sessie nog wordt opgeslagen, wacht de composer op die sessiepatch voordat `chat.send` wordt aangeroepen, zodat de verzending het geselecteerde model gebruikt.
    - Het typen van `/new` in de Control UI maakt dezelfde nieuwe dashboardsessie aan als Nieuwe chat en schakelt daarheen, behalve wanneer `session.dmScope: "main"` is geconfigureerd en de huidige ouder de hoofdsessie van de agent is; in dat geval wordt de hoofdsessie ter plekke gereset. Het typen van `/reset` behoudt de expliciete in-place reset van de Gateway voor de huidige sessie.
    - De chatmodelkiezer vraagt de geconfigureerde modelweergave van de Gateway op. Als `agents.defaults.models` aanwezig is, stuurt die allowlist de kiezer aan, inclusief `provider/*`-vermeldingen die provider-beperkte catalogi dynamisch houden. Anders toont de kiezer expliciete `models.providers.*.models`-vermeldingen plus providers met bruikbare auth. De volledige catalogus blijft beschikbaar via de debug-`models.list` RPC met `view: "all"`.
    - Wanneer verse gebruiksrapporten van Gateway-sessies huidige contexttokens bevatten, toont de chatcomposerwerkbalk een kleine contextgebruikring met het gebruikte percentage; de volledige tokendetails staan in de tooltip. De ring schakelt over naar waarschuwingsstijl bij hoge contextdruk en toont, op aanbevolen Compaction-niveaus, een compacte knop die het normale sessie-Compaction-pad uitvoert. Verouderde tokensnapshots worden verborgen totdat de Gateway opnieuw vers gebruik rapporteert.

  </Accordion>
  <Accordion title="Praatmodus (browser-realtime)">
    Praatmodus gebruikt een geregistreerde realtime spraakprovider. Configureer OpenAI met `talk.realtime.provider: "openai"` plus een `openai`-API-key-auth-profiel, `talk.realtime.providers.openai.apiKey` of `OPENAI_API_KEY`; OpenAI OAuth-profielen configureren geen Realtime-spraak. Configureer Google met `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey`. De browser ontvangt nooit een standaard provider-API-key. OpenAI ontvangt een tijdelijke Realtime-clientsecret voor WebRTC. Google Live ontvangt een eenmalige beperkte Live API-auth-token voor een browser-WebSocket-sessie, waarbij instructies en tooldeclaraties door de Gateway in de token zijn vastgezet. Providers die alleen een backend-realtimebridge aanbieden, lopen via het Gateway-relaytransport, zodat credentials en vendorsockets server-side blijven terwijl browseraudio via geauthenticeerde Gateway-RPC's beweegt. De Realtime-sessieprompt wordt samengesteld door de Gateway; `talk.client.create` accepteert geen door de aanroeper aangeleverde instructie-overrides.

    De Chat-composer bevat een knop voor Talk-opties naast de start/stop-knop voor Talk. De opties gelden voor de volgende Talk-sessie en kunnen provider, transport, model, stem, redeneerinspanning, VAD-drempel, stilteduur en prefix-padding overschrijven. Wanneer een optie leeg is, gebruikt de Gateway geconfigureerde standaardwaarden waar beschikbaar, of de standaardwaarde van de provider. Gateway-relay selecteren dwingt het backend-relaypad af; WebRTC selecteren houdt de sessie in beheer van de client en laat deze mislukken in plaats van stil terug te vallen op relay als de provider geen browsersessie kan maken.

    In de Chat-composer is de Talk-bediening de golfknop naast de microfoonknop voor dicteren. Wanneer Talk start, toont de statusrij van de composer `Connecting Talk...`, daarna `Talk live` zolang audio is verbonden, of `Asking OpenClaw...` terwijl een realtime toolaanroep het geconfigureerde grotere model raadpleegt via `talk.client.toolCall`.

    Live smoke voor maintainers: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifieert de OpenAI-backend-WebSocket-bridge, de OpenAI-browser-WebRTC-SDP-uitwisseling, de Google Live-browsersetup met beperkte tokens en WebSocket, en de Gateway-relay-browseradapter met nep-microfoonmedia. De opdracht print alleen providerstatus en logt geen geheimen.

  </Accordion>
  <Accordion title="Stoppen en afbreken">
    - Klik op **Stop** (roept `chat.abort` aan).
    - Terwijl een run actief is, worden normale vervolgberichten in de wachtrij geplaatst. Klik op **Steer** bij een bericht in de wachtrij om dat vervolgbericht in de lopende beurt te injecteren.
    - Typ `/stop` (of zelfstandige afbreekzinnen zoals `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) om buiten de normale band af te breken.
    - `chat.abort` ondersteunt `{ sessionKey }` (geen `runId`) om alle actieve runs voor die sessie af te breken.

  </Accordion>
  <Accordion title="Behoud van gedeeltelijke afbreekoutput">
    - Wanneer een run wordt afgebroken, kan gedeeltelijke assistenttekst nog steeds in de UI worden getoond.
    - Gateway bewaart afgebroken gedeeltelijke assistenttekst in de transcriptgeschiedenis wanneer gebufferde output bestaat.
    - Bewaarde vermeldingen bevatten afbreekmetadata, zodat transcriptconsumenten afgebroken gedeeltelijke output kunnen onderscheiden van normale voltooiingsoutput.

  </Accordion>
</AccordionGroup>

## PWA-installatie en Web Push

De Control UI levert een `manifest.webmanifest` en een serviceworker, zodat moderne browsers deze als zelfstandige PWA kunnen installeren. Met Web Push kan de Gateway de geïnstalleerde PWA met meldingen wekken, zelfs wanneer het tabblad of browservenster niet open is.

Als de pagina direct na een OpenClaw-update **Protocol mismatch** toont, open dan eerst het dashboard opnieuw met `openclaw dashboard` en vernieuw de pagina volledig. Als dit nog steeds mislukt, wis dan de sitegegevens voor de dashboard-origin of test in een privébrowservenster; een oud tabblad of een serviceworker-cache van de browser kan een Control UI-bundel van vóór de update blijven draaien tegen de nieuwere Gateway.

| Oppervlak                                             | Wat het doet                                                      |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                      | PWA-manifest. Browsers bieden "App installeren" aan zodra het bereikbaar is. |
| `ui/public/sw.js`                                     | Serviceworker die `push`-events en klikken op meldingen afhandelt. |
| `push/vapid-keys.json` (onder de OpenClaw-state-map)  | Automatisch gegenereerd VAPID-sleutelpaar dat wordt gebruikt om Web Push-payloads te ondertekenen. |
| `push/web-push-subscriptions.json`                    | Bewaarde browserabonnementseindpunten.                            |

Overschrijf het VAPID-sleutelpaar via omgevingsvariabelen op het Gateway-proces wanneer je sleutels wilt vastpinnen (voor multi-host-deployments, geheimrotatie of tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (standaard `https://openclaw.ai`)

De Control UI gebruikt deze scope-afgeschermde Gateway-methoden om browserabonnementen te registreren en te testen:

- `push.web.vapidPublicKey` — haalt de actieve openbare VAPID-sleutel op.
- `push.web.subscribe` — registreert een `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — verwijdert een geregistreerd eindpunt.
- `push.web.test` — verstuurt een testmelding naar het abonnement van de aanroeper.

<Note>
Web Push staat los van het iOS-APNS-relaypad (zie [Configuratie](/nl/gateway/configuration) voor push met relay-ondersteuning) en de bestaande methode `push.test`, die gericht zijn op native mobiele koppeling.
</Note>

## Gehoste embeds

Assistentberichten kunnen gehoste webinhoud inline renderen met de shortcode `[embed ...]`. Het iframe-sandboxbeleid wordt geregeld door `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Schakelt scriptuitvoering binnen gehoste embeds uit.
  </Tab>
  <Tab title="scripts (standaard)">
    Staat interactieve embeds toe terwijl origin-isolatie behouden blijft; dit is de standaardinstelling en is meestal voldoende voor zelfstandige browsergames/widgets.
  </Tab>
  <Tab title="trusted">
    Voegt `allow-same-origin` toe bovenop `allow-scripts` voor documenten op dezelfde site die bewust sterkere rechten nodig hebben.
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
Gebruik `trusted` alleen wanneer het ingesloten document daadwerkelijk same-origin-gedrag nodig heeft. Voor de meeste door agents gegenereerde games en interactieve canvassen is `scripts` de veiligere keuze.
</Warning>

Absolute externe `http(s)`-embed-URL's blijven standaard geblokkeerd. Als je bewust wilt dat `[embed url="https://..."]` pagina's van derden laadt, stel dan `gateway.controlUi.allowExternalEmbedUrls: true` in.

## Breedte van chatberichten

Gegroepeerde chatberichten gebruiken een leesbare standaard maximale breedte. Deployments met brede monitors kunnen deze overschrijven zonder gebundelde CSS te patchen door `gateway.controlUi.chatMessageMaxWidth` in te stellen:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

De waarde wordt gevalideerd voordat deze de browser bereikt. Ondersteunde waarden zijn onder meer gewone lengtes en percentages zoals `960px` of `82%`, plus begrensde breedte-expressies met `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` en `fit-content(...)`.

## Tailnet-toegang (aanbevolen)

<Tabs>
  <Tab title="Geïntegreerde Tailscale Serve (voorkeur)">
    Houd de Gateway op loopback en laat Tailscale Serve deze met HTTPS proxyen:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Open:

    - `https://<magicdns>/` (of je geconfigureerde `gateway.controlUi.basePath`)

    Standaard kunnen Control UI/WebSocket-Serve-verzoeken authenticeren via Tailscale-identiteitsheaders (`tailscale-user-login`) wanneer `gateway.auth.allowTailscale` `true` is. OpenClaw verifieert de identiteit door het `x-forwarded-for`-adres op te lossen met `tailscale whois` en dit met de header te matchen, en accepteert deze alleen wanneer het verzoek loopback bereikt met Tailscale's `x-forwarded-*`-headers. Voor Control UI-operatorsessies met browserapparaatidentiteit slaat dit geverifieerde Serve-pad ook de apparaatkoppelingsroundtrip over; browsers zonder apparaat en verbindingen met node-rol volgen nog steeds de normale apparaatcontroles. Stel `gateway.auth.allowTailscale: false` in als je expliciete gedeelde-geheime inloggegevens wilt vereisen, ook voor Serve-verkeer. Gebruik daarna `gateway.auth.mode: "token"` of `"password"`.

    Voor dat asynchrone Serve-identiteitspad worden mislukte authenticatiepogingen voor hetzelfde client-IP en dezelfde authenticatiescope geserialiseerd voordat rate-limit-schrijfacties plaatsvinden. Gelijktijdige foutieve nieuwe pogingen vanuit dezelfde browser kunnen daarom `retry later` tonen bij het tweede verzoek, in plaats van twee gewone mismatches die parallel racen.

    <Warning>
    Tokenloze Serve-authenticatie gaat ervan uit dat de gatewayhost vertrouwd is. Als niet-vertrouwde lokale code op die host kan draaien, vereis dan token-/wachtwoordauthenticatie.
    </Warning>

  </Tab>
  <Tab title="Binden aan tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Open daarna:

    - `http://<tailscale-ip>:18789/` (of je geconfigureerde `gateway.controlUi.basePath`)

    Plak het overeenkomende gedeelde geheim in de UI-instellingen (verzonden als `connect.params.auth.token` of `connect.params.auth.password`).

  </Tab>
</Tabs>

## Onveilige HTTP

Als je het dashboard opent via gewone HTTP (`http://<lan-ip>` of `http://<tailscale-ip>`), draait de browser in een **niet-veilige context** en blokkeert deze WebCrypto. Standaard **blokkeert** OpenClaw Control UI-verbindingen zonder apparaatidentiteit.

Gedocumenteerde uitzonderingen:

- alleen-localhost compatibiliteit met onveilige HTTP via `gateway.controlUi.allowInsecureAuth=true`
- succesvolle operator-Control UI-authenticatie via `gateway.auth.mode: "trusted-proxy"`
- noodoptie `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Aanbevolen oplossing:** gebruik HTTPS (Tailscale Serve) of open de UI lokaal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (op de gatewayhost)

<AccordionGroup>
  <Accordion title="Gedrag van onveilige-authenticatie-toggle">
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

    - Hiermee kunnen localhost-Control UI-sessies doorgaan zonder apparaatidentiteit in niet-veilige HTTP-contexten.
    - Hiermee worden koppelingscontroles niet omzeild.
    - Hiermee worden vereisten voor apparaatidentiteit op afstand (niet-localhost) niet versoepeld.

  </Accordion>
  <Accordion title="Alleen noodoptie">
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
    `dangerouslyDisableDeviceAuth` schakelt apparaatidentiteitscontroles voor de Control UI uit en is een ernstige beveiligingsverlaging. Draai dit snel terug na noodgebruik.
    </Warning>

  </Accordion>
  <Accordion title="Opmerking over trusted proxy">
    - Succesvolle trusted-proxy-authenticatie kan **operator**-Control UI-sessies toelaten zonder apparaatidentiteit.
    - Dit geldt **niet** voor Control UI-sessies met node-rol.
    - Same-host loopback reverse proxies voldoen nog steeds niet aan trusted-proxy-authenticatie; zie [Trusted proxy auth](/nl/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Zie [Tailscale](/nl/gateway/tailscale) voor richtlijnen voor HTTPS-configuratie.

## Content security policy

De Control UI wordt geleverd met een strikt `img-src`-beleid: alleen assets van **same-origin**, `data:`-URL's en lokaal gegenereerde `blob:`-URL's zijn toegestaan. Externe `http(s)`- en protocol-relatieve afbeeldings-URL's worden door de browser geweigerd en veroorzaken geen netwerkfetches.

Wat dit in de praktijk betekent:

- Avatars en afbeeldingen die onder relatieve paden worden aangeboden (bijvoorbeeld `/avatars/<id>`) renderen nog steeds, inclusief geauthenticeerde avatarroutes die de UI ophaalt en omzet naar lokale `blob:`-URL's.
- Inline `data:image/...`-URL's renderen nog steeds (handig voor payloads binnen het protocol).
- Lokale `blob:`-URL's die door de Control UI zijn gemaakt, renderen nog steeds.
- Externe avatar-URL's die door kanaalmetadata worden uitgegeven, worden bij de avatarhelpers van de Control UI gestript en vervangen door het ingebouwde logo/badge, zodat een gecompromitteerd of kwaadaardig kanaal geen willekeurige externe afbeeldingsfetches vanuit een operatorbrowser kan afdwingen.

Je hoeft niets te wijzigen om dit gedrag te krijgen — het staat altijd aan en is niet configureerbaar.

## Authenticatie voor avatarroute

Wanneer gateway-authenticatie is geconfigureerd, vereist het avatar-eindpunt van de Control UI hetzelfde gatewaytoken als de rest van de API:

- `GET /avatar/<agentId>` retourneert de avatarafbeelding alleen aan geauthenticeerde aanroepers. `GET /avatar/<agentId>?meta=1` retourneert de avatarmetadata volgens dezelfde regel.
- Niet-geauthenticeerde verzoeken naar beide routes worden geweigerd (in lijn met de verwante assistant-media-route). Dit voorkomt dat de avatarroute agentidentiteit lekt op hosts die verder beschermd zijn.
- De Control UI zelf stuurt het gatewaytoken door als bearer-header bij het ophalen van avatars en gebruikt geauthenticeerde blob-URL's zodat de afbeelding nog steeds in dashboards rendert.

Als je Gateway-auth uitschakelt (niet aanbevolen op gedeelde hosts), wordt de avatar-route ook niet-geverifieerd, in lijn met de rest van de Gateway.

## Auth voor assistentmediaroute

Wanneer Gateway-auth is geconfigureerd, gebruiken lokale mediavoorvertoningen van de assistent een tweestapsroute:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` vereist de normale operator-auth van de Control UI. De browser verzendt het Gateway-token als bearer-header bij het controleren van beschikbaarheid.
- Geslaagde metadataresponses bevatten een kortlevende `mediaTicket` die is beperkt tot dat exacte bronpad.
- Door de browser gerenderde URL's voor afbeeldingen, audio, video en documenten gebruiken `mediaTicket=<ticket>` in plaats van het actieve Gateway-token of wachtwoord. Het ticket verloopt snel en kan geen andere bron autoriseren.

Zo blijft normale mediaweergave compatibel met browser-native media-elementen zonder herbruikbare Gateway-inloggegevens in zichtbare media-URL's te plaatsen.

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

Richt de UI daarna op je Gateway WS-URL (bijv. `ws://127.0.0.1:18789`).

## Lege Control UI-pagina

Als de browser een leeg dashboard laadt en DevTools geen bruikbare fout toont, heeft een extensie of vroeg contentscript mogelijk verhinderd dat de JavaScript-module-app werd geëvalueerd. De statische pagina bevat een gewoon HTML-herstelpaneel dat verschijnt wanneer `<openclaw-app>` na het opstarten niet is geregistreerd.

Gebruik de actie **Opnieuw proberen** van het paneel nadat je de browseromgeving hebt gewijzigd, of laad handmatig opnieuw na deze controles:

- Schakel extensies uit die in alle pagina's injecteren, vooral extensies met `<all_urls>`-contentscripts.
- Probeer een privévenster, een schoon browserprofiel of een andere browser.
- Houd de Gateway actief en controleer dezelfde dashboard-URL na de browserwijziging.

## Debuggen/testen: dev-server + externe Gateway

De Control UI bestaat uit statische bestanden; het WebSocket-doel is configureerbaar en kan verschillen van de HTTP-origin. Dit is handig wanneer je de Vite-dev-server lokaal wilt gebruiken, maar de Gateway elders draait.

<Steps>
  <Step title="Start de UI-dev-server">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Openen met gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    Optionele eenmalige auth (indien nodig):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Opmerkingen">
    - `gatewayUrl` wordt na het laden opgeslagen in localStorage en uit de URL verwijderd.
    - Als je een volledig `ws://`- of `wss://`-endpoint via `gatewayUrl` doorgeeft, URL-encodeer dan de waarde van `gatewayUrl` zodat de browser de querystring correct parseert.
    - `token` moet waar mogelijk via het URL-fragment (`#token=...`) worden doorgegeven. Fragmenten worden niet naar de server verzonden, wat lekken via requestlogs en Referer voorkomt. Verouderde `?token=`-queryparameters worden voor compatibiliteit nog steeds eenmaal geïmporteerd, maar alleen als fallback, en worden direct na bootstrap verwijderd.
    - `password` wordt alleen in het geheugen bewaard.
    - Wanneer `gatewayUrl` is ingesteld, valt de UI niet terug op configuratie- of omgevingsinloggegevens. Geef `token` (of `password`) expliciet op. Ontbrekende expliciete inloggegevens zijn een fout.
    - Gebruik `wss://` wanneer de Gateway achter TLS zit (Tailscale Serve, HTTPS-proxy, enz.).
    - `gatewayUrl` wordt alleen geaccepteerd in een top-level venster (niet ingesloten) om clickjacking te voorkomen.
    - Publieke non-loopback Control UI-deployments moeten `gateway.controlUi.allowedOrigins` expliciet instellen (volledige origins). Privé same-origin LAN/Tailnet-loads vanaf loopback-, RFC1918/link-local-, `.local`-, `.ts.net`- of Tailscale CGNAT-hosts worden geaccepteerd zonder Host-header-fallback in te schakelen.
    - Gateway-startup kan lokale origins zoals `http://localhost:<port>` en `http://127.0.0.1:<port>` seeden vanuit de effectieve runtime-bind en poort, maar externe browser-origins hebben nog steeds expliciete vermeldingen nodig.
    - Gebruik `gateway.controlUi.allowedOrigins: ["*"]` niet, behalve voor strikt gecontroleerd lokaal testen. Het betekent elke browser-origin toestaan, niet "match welke host ik ook gebruik."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` schakelt Host-header-origin-fallbackmodus in, maar dit is een gevaarlijke beveiligingsmodus.

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

Details voor instellen van externe toegang: [Externe toegang](/nl/gateway/remote).

## Gerelateerd

- [Dashboard](/nl/web/dashboard) — Gateway-dashboard
- [Statuscontroles](/nl/gateway/health) — gezondheidsbewaking van de Gateway
- [TUI](/nl/web/tui) — terminalgebruikersinterface
- [WebChat](/nl/web/webchat) — browsergebaseerde chatinterface
