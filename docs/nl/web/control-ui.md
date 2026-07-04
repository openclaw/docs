---
read_when:
    - Je wilt de Gateway vanuit een browser bedienen
    - Je wilt Tailnet-toegang zonder SSH-tunnels
sidebarTitle: Control UI
summary: Browsergebaseerde beheer-UI voor de Gateway (chat, activiteit, knooppunten, configuratie)
title: Besturings-UI
x-i18n:
    generated_at: "2026-07-04T20:38:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 883e951b304a104a5cb2d0197199d06e372b1b8a25efdfd082ae190575bf409d
    source_path: web/control-ui.md
    workflow: 16
---

De Control UI is een kleine **Vite + Lit** single-page app die door de Gateway wordt geserveerd:

- standaard: `http://<host>:18789/`
- optioneel prefix: stel `gateway.controlUi.basePath` in (bijv. `/openclaw`)

Deze communiceert **rechtstreeks met de Gateway WebSocket** op dezelfde poort.

## Snel openen (lokaal)

Als de Gateway op dezelfde computer draait, open je:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (of [http://localhost:18789/](http://localhost:18789/))

Als de pagina niet laadt, start dan eerst de Gateway: `openclaw gateway`.

<Note>
Bij native Windows-LAN-binds kunnen Windows Firewall of door de organisatie beheerde Group Policy de geadverteerde LAN-URL nog steeds blokkeren, zelfs wanneer `127.0.0.1` werkt op de Gateway-host. Voer `openclaw gateway status --deep` uit op de Windows-host; dit rapporteert waarschijnlijk geblokkeerde poorten, profielmismatches en lokale firewallregels die door beleid mogelijk worden genegeerd.
</Note>

Auth wordt tijdens de WebSocket-handshake aangeleverd via:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve-identiteitsheaders wanneer `gateway.auth.allowTailscale: true`
- trusted-proxy-identiteitsheaders wanneer `gateway.auth.mode: "trusted-proxy"`

Het instellingenpaneel van het dashboard bewaart een token voor de huidige browsertabsessie en de geselecteerde Gateway-URL; wachtwoorden worden niet bewaard. Onboarding genereert meestal bij de eerste verbinding een Gateway-token voor shared-secret-auth, maar wachtwoordauth werkt ook wanneer `gateway.auth.mode` `"password"` is.

## Apparaat koppelen (eerste verbinding)

Wanneer je vanuit een nieuwe browser of vanaf een nieuw apparaat verbinding maakt met de Control UI, vereist de Gateway meestal een **eenmalige koppelingsgoedkeuring**. Dit is een beveiligingsmaatregel om ongeautoriseerde toegang te voorkomen.

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

Als de browser opnieuw probeert te koppelen met gewijzigde authgegevens (rol/scopes/publieke sleutel), wordt de vorige openstaande aanvraag vervangen en wordt er een nieuwe `requestId` aangemaakt. Voer vóór goedkeuring opnieuw `openclaw devices list` uit.

Als de browser al gekoppeld is en je deze wijzigt van leestoegang naar schrijf-/admintoegang, wordt dit behandeld als een goedkeuringsupgrade, niet als een stille herverbinding. OpenClaw houdt de oude goedkeuring actief, blokkeert de bredere herverbinding en vraagt je om de nieuwe scopeset expliciet goed te keuren.

Na goedkeuring wordt het apparaat onthouden en is geen hergoedkeuring nodig, tenzij je het intrekt met `openclaw devices revoke --device <id> --role <role>`. Zie [Devices CLI](/nl/cli/devices) voor tokenrotatie en intrekking.

Paperclip-agents die verbinding maken via de `openclaw_gateway`-adapter gebruiken dezelfde goedkeuringsflow bij de eerste uitvoering. Voer na de eerste verbindingspoging `openclaw devices approve --latest` uit om de openstaande aanvraag te bekijken en voer daarna opnieuw de afgedrukte opdracht `openclaw devices approve <requestId>` uit om deze goed te keuren. Geef expliciete `--url`- en `--token`-waarden door voor een externe Gateway. Configureer een permanente `adapterConfig.devicePrivateKeyPem` in Paperclip in plaats van bij elke uitvoering een nieuwe tijdelijke apparaatidentiteit te laten genereren, zodat goedkeuringen stabiel blijven tussen herstarts.

<Note>
- Rechtstreekse browserverbindingen via local loopback (`127.0.0.1` / `localhost`) worden automatisch goedgekeurd.
- Tailscale Serve kan de koppelingsronde overslaan voor Control UI-operatorsessies wanneer `gateway.auth.allowTailscale: true`, de Tailscale-identiteit wordt geverifieerd en de browser zijn apparaatidentiteit presenteert.
- Rechtstreekse Tailnet-binds, LAN-browserverbindingen en browserprofielen zonder apparaatidentiteit vereisen nog steeds expliciete goedkeuring.
- Elk browserprofiel genereert een unieke apparaat-ID, dus wisselen van browser of het wissen van browsergegevens vereist opnieuw koppelen.

</Note>

## Een mobiel apparaat koppelen

Een al gekoppelde beheerder kan de iOS/Android-verbindings-QR aanmaken zonder
een terminal te openen:

<Steps>
  <Step title="Mobiele koppeling openen">
    Selecteer **Nodes** en klik daarna op **Mobiel apparaat koppelen** in de kaart **Apparaten**.
  </Step>
  <Step title="De telefoon verbinden">
    Open in de mobiele OpenClaw-app **Instellingen** → **Gateway** en scan de QR-
    code. Je kunt in plaats daarvan de instelcode kopiëren en plakken.
  </Step>
  <Step title="De verbinding bevestigen">
    De officiële iOS/Android-app maakt automatisch verbinding. Als **Apparaten** een
    openstaande aanvraag toont, controleer dan de rol en scopes voordat je deze goedkeurt.
  </Step>
</Steps>

Voor het aanmaken van een instelcode is `operator.admin` vereist; de knop is uitgeschakeld voor
sessies zonder deze scope. Een instelcode bevat een kortlevende bootstrapreferentie,
dus behandel de QR en gekopieerde code als een wachtwoord zolang ze geldig zijn. Voor extern
koppelen moet de Gateway naar `wss://` resolven (bijvoorbeeld via Tailscale
Serve/Funnel); gewone `ws://` is beperkt tot loopback- en privé-LAN-adressen.
Zie [Koppelen](/nl/channels/pairing#pair-from-the-control-ui-recommended) voor de
volledige beveiligings- en fallbackdetails.

## Persoonlijke identiteit (browserlokaal)

De Control UI ondersteunt een persoonlijke identiteit per browser (weergavenaam en avatar) die aan uitgaande berichten wordt gekoppeld voor attributie in gedeelde sessies. Deze staat in browseropslag, is beperkt tot het huidige browserprofiel en wordt niet gesynchroniseerd met andere apparaten of server-side bewaard buiten de normale transcript-auteurschapsmetadata op berichten die je daadwerkelijk verstuurt. Het wissen van sitegegevens of wisselen van browser zet deze terug naar leeg.

Hetzelfde browserlokale patroon geldt voor de overschrijving van de assistentavatar. Geüploade assistentavatars leggen de door de Gateway opgeloste identiteit alleen over de lokale browser heen en maken nooit een retour via `config.patch`. Het gedeelde configuratieveld `ui.assistant.avatar` blijft beschikbaar voor niet-UI-clients die het veld rechtstreeks schrijven (zoals gescripte gateways of aangepaste dashboards).

## Runtime-configuratie-endpoint

De Control UI haalt de runtime-instellingen op uit `/control-ui-config.json`, opgelost relatief ten opzichte van het Control UI-basispad van de Gateway (bijvoorbeeld `/__openclaw__/control-ui-config.json` wanneer de UI onder `/__openclaw__/` wordt geserveerd). Dat endpoint wordt afgeschermd door dezelfde Gateway-auth als de rest van het HTTP-oppervlak: niet-geauthenticeerde browsers kunnen het niet ophalen, en een geslaagde fetch vereist een al geldig Gateway-token/wachtwoord, Tailscale Serve-identiteit of een trusted-proxy-identiteit.

## Taalondersteuning

De Control UI kan zichzelf bij de eerste laadactie lokaliseren op basis van je browserlocale. Open **Overzicht -> Gateway-toegang -> Taal** om dit later te overschrijven. De locale-kiezer staat in de Gateway-toegangskaart, niet onder Weergave.

- Ondersteunde locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Niet-Engelse vertalingen worden lazy-loaded in de browser.
- De geselecteerde locale wordt opgeslagen in browseropslag en opnieuw gebruikt bij toekomstige bezoeken.
- Ontbrekende vertaalsleutels vallen terug op Engels.

Docs-vertalingen worden gegenereerd voor dezelfde niet-Engelse localeset, maar de ingebouwde Mintlify-taalkiezer van de docssite is beperkt tot de localecodes die Mintlify accepteert. Thaise (`th`) en Perzische (`fa`) docs worden nog steeds gegenereerd in de publish-repo; ze verschijnen mogelijk pas in die kiezer zodra Mintlify deze codes ondersteunt.

## Weergavethema's

Het paneel Weergave behoudt de ingebouwde thema's Claw, Knot en Dash, plus één browserlokale tweakcn-importsleuf. Open [tweakcn editor](https://tweakcn.com/editor/theme), kies of maak een thema, klik op **Delen** en plak de gekopieerde themalink in Weergave om een thema te importeren. De importer accepteert ook `https://tweakcn.com/r/themes/<id>`-register-URL's, editor-URL's zoals `https://tweakcn.com/editor/theme?theme=amethyst-haze`, relatieve `/themes/<id>`-paden, ruwe thema-ID's en standaardthemanamen zoals `amethyst-haze`.

Weergave bevat ook een browserlokale instelling voor tekstgrootte. De instelling wordt opgeslagen met de rest van de Control UI-voorkeuren, geldt voor chattekst, composertekst, toolkaarten en chatzijbalken, en houdt tekstinvoer op minimaal 16px zodat mobiele Safari niet automatisch inzoomt bij focus.

Geïmporteerde thema's worden alleen opgeslagen in het huidige browserprofiel. Ze worden niet naar de Gateway-configuratie geschreven en synchroniseren niet tussen apparaten. Het vervangen van het geïmporteerde thema werkt de ene lokale sleuf bij; het wissen ervan schakelt het actieve thema terug naar Claw als het geïmporteerde thema geselecteerd was.

## Wat het kan doen (vandaag)

<AccordionGroup>
  <Accordion title="Chatten en praten">
    - Chat met het model via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Vernieuwingen van de chatgeschiedenis vragen een begrensd recent venster op met tekstlimieten per bericht, zodat grote sessies de browser niet dwingen een volledige transcriptpayload te renderen voordat de chat bruikbaar wordt.
    - Praat via realtime browsersessies. OpenAI gebruikt directe WebRTC, Google Live gebruikt een beperkt eenmalig browsertoken via WebSocket, en backend-only realtime spraakplugins gebruiken het Gateway-relaytransport. Provider-sessies die door de client worden beheerd starten met `talk.client.create`; Gateway-relaysessies starten met `talk.session.create`. De relay houdt providerreferenties op de Gateway terwijl de browser microfoon-PCM streamt via `talk.session.appendAudio`, stuurt `openclaw_agent_consult`-providertoolcalls door via `talk.client.toolCall` voor Gateway-beleid en het grotere geconfigureerde OpenClaw-model, en routeert spraaksturing voor actieve runs via `talk.client.steer` of `talk.session.steer`.
    - Stream toolcalls + live tooluitvoerkaarten in Chat (agentgebeurtenissen).
    - Activiteitstabblad met browserlokale, redaction-first samenvattingen van live toolactiviteit uit bestaande `session.tool` / toolgebeurtenislevering.

  </Accordion>
  <Accordion title="Kanalen, instanties, sessies, dromen">
    - Kanalen: status van ingebouwde plus gebundelde/externe pluginkanalen, QR-login en configuratie per kanaal (`channels.status`, `web.login.*`, `config.patch`).
    - Vernieuwingen van kanaalprobes houden de vorige snapshot zichtbaar terwijl trage providercontroles afronden, en gedeeltelijke snapshots krijgen een label wanneer een probe of audit het UI-budget overschrijdt.
    - Instanties: aanwezigheidslijst + vernieuwen (`system-presence`).
    - Sessies: geef standaard geconfigureerde-agent-sessies weer, pin frequente sessies, hernoem ze, archiveer of herstel inactieve sessies, val terug vanaf verouderde niet-geconfigureerde agent-sessiesleutels en pas model-/thinking-/fast-/verbose-/trace-/reasoning-overschrijvingen per sessie toe (`sessions.list`, `sessions.patch`). Gepinde sessies sorteren boven recente niet-gepinde sessies; gearchiveerde sessies staan in de gearchiveerde weergave van de pagina Sessies en behouden hun transcripten.
    - Dromen: Dreaming-status, aan/uit-schakelaar en Dream Diary-lezer (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, nodes, exec-goedkeuringen">
    - Cron-taken: weergeven/toevoegen/bewerken/uitvoeren/inschakelen/uitschakelen + uitvoeringsgeschiedenis (`cron.*`).
    - Skills: status, inschakelen/uitschakelen, installeren, API-sleutelupdates (`skills.*`).
    - Nodes: lijst + capabilities (`node.list`), mobiele instelcodes maken en apparaatkoppeling goedkeuren (`device.pair.*`).
    - Exec-goedkeuringen: Gateway- of node-allowlists bewerken + ask-beleid voor `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuratie">
    - Bekijk/bewerk `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP heeft een speciale instellingenpagina voor geconfigureerde servers, inschakeling, OAuth-/filter-/parallelle samenvattingen, algemene operatorcommando's en de scoped `mcp`-configuratie-editor.
    - Pas toe + herstart met validatie (`config.apply`) en wek de laatst actieve sessie.
    - Schrijfacties bevatten een base-hash-guard om te voorkomen dat gelijktijdige bewerkingen worden overschreven.
    - Schrijfacties (`config.set`/`config.apply`/`config.patch`) voeren vooraf actieve SecretRef-resolutie uit voor refs in de ingediende config-payload; niet-opgeloste actieve ingediende refs worden vóór het schrijven geweigerd.
    - Formulieropslag verwijdert verouderde geredigeerde placeholders die niet uit de opgeslagen configuratie kunnen worden hersteld, terwijl geredigeerde waarden die nog steeds aan opgeslagen geheimen koppelen behouden blijven.
    - Schema + formulierweergave (`config.schema` / `config.schema.lookup`, inclusief veld `title` / `description`, overeenkomende UI-hints, directe onderliggende samenvattingen, docs-metadata op geneste object-/wildcard-/array-/compositienodes, plus Plugin- + kanaalschema's wanneer beschikbaar); de Raw JSON-editor is alleen beschikbaar wanneer de snapshot een veilige raw round-trip heeft.
    - Als een snapshot raw tekst niet veilig kan round-trippen, dwingt Control UI de formuliermodus af en schakelt Raw-modus uit voor die snapshot.
    - Raw JSON-editor "Terugzetten naar opgeslagen" behoudt de raw-authored vorm (opmaak, opmerkingen, `$include`-indeling) in plaats van een afgevlakte snapshot opnieuw te renderen, zodat externe bewerkingen een reset overleven wanneer de snapshot veilig kan round-trippen.
    - Gestructureerde SecretRef-objectwaarden worden alleen-lezen weergegeven in tekstinvoervelden van formulieren om onbedoelde object-naar-string-corruptie te voorkomen.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debug: snapshots van status/gezondheid/modellen + eventlog + handmatige RPC-aanroepen (`status`, `health`, `models.list`).
    - Het eventlog bevat Control UI-verversings-/RPC-timings, timings van trage chat-/configuratie-rendering en vermeldingen over browserresponsiviteit voor lange animatieframes of lange taken wanneer de browser die PerformanceObserver-entrytypen beschikbaar stelt.
    - Logs: live tail van Gateway-bestandslogs met filter/export (`logs.tail`).
    - Update: voer een package-/git-update + herstart uit (`update.run`) met een herstartrapport, en poll daarna `update.status` na opnieuw verbinden om de draaiende Gateway-versie te verifiëren.

  </Accordion>
  <Accordion title="Notities voor Cron jobs-paneel">
    - Voor geïsoleerde jobs is de standaardlevering het aankondigen van een samenvatting. Je kunt overschakelen naar geen als je alleen-interne runs wilt.
    - Velden voor kanaal/doel verschijnen wanneer aankondigen is geselecteerd.
    - Webhook-modus gebruikt `delivery.mode = "webhook"` met `delivery.to` ingesteld op een geldige HTTP(S)-webhook-URL.
    - Voor main-session-jobs zijn Webhook- en geen-leveringsmodi beschikbaar.
    - Geavanceerde bewerkingsopties omvatten verwijderen-na-run, agent-override wissen, exacte/gespreide cron-opties, agentmodel-/thinking-overrides en best-effort-leveringstoggles.
    - Formuliervalidatie is inline met fouten op veldniveau; ongeldige waarden schakelen de opslagknop uit totdat ze zijn gecorrigeerd.
    - Stel `cron.webhookToken` in om een speciale bearer-token te sturen; indien weggelaten wordt de webhook zonder auth-header verzonden.
    - Verouderde fallback: voer `openclaw doctor --fix` uit om opgeslagen legacy jobs met `notify: true` te migreren van `cron.webhook` naar expliciete webhook- of voltooiingslevering per job.

  </Accordion>
</AccordionGroup>

## MCP-pagina

De speciale MCP-pagina is een operatorweergave voor door OpenClaw beheerde MCP-servers onder `mcp.servers`. Deze start zelf geen MCP-transports; gebruik de pagina om opgeslagen configuratie te inspecteren en bewerken, en gebruik daarna `openclaw mcp doctor --probe` wanneer je live serverbewijs nodig hebt.

Typische workflow:

1. Open **MCP** vanuit de zijbalk.
2. Controleer de samenvattingskaarten voor aantallen totaal, ingeschakeld, OAuth en gefilterde servers.
3. Bekijk elke serverrij op transport, inschakeling, auth, filters, time-outs en commandohints.
4. Schakel inschakeling om wanneer een server geconfigureerd moet blijven maar buiten runtime-discovery moet blijven.
5. Bewerk de scoped `mcp`-configuratiesectie voor serverdefinities, headers, TLS-/mTLS-paden, OAuth-metadata, toolfilters en Codex-projectiemetadata.
6. Gebruik **Opslaan** voor een configuratieschrijfactie, of **Opslaan en publiceren** wanneer de draaiende Gateway de gewijzigde configuratie moet toepassen.
7. Voer `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` of `openclaw mcp reload` uit vanuit een terminal wanneer het bewerkte proces statische diagnostiek, live bewijs of cached-runtime-opruiming nodig heeft.

De pagina redigeert URL-achtige waarden die credentials bevatten vóór rendering en zet servernamen tussen aanhalingstekens in commandofragmenten zodat gekopieerde commando's nog steeds werken met spaties of shell-metatekens. De volledige CLI- en configuratiereferentie staat in [MCP](/nl/cli/mcp).

## Activiteitstabblad

Het tabblad Activiteit is een vluchtige browser-lokale observer voor live toolactiviteit. Het is afgeleid van dezelfde Gateway `session.tool` / tool-eventstream die Chat-toolkaarten aanstuurt; het voegt geen extra Gateway-eventfamilie, endpoint, duurzame activiteitenopslag, metrics-feed of externe observerstream toe.

Activiteitsitems bewaren alleen opgeschoonde samenvattingen en geredigeerde, afgekorte uitvoervoorbeelden. Toolargumentwaarden worden niet opgeslagen in Activiteit-state; de UI toont dat argumenten verborgen zijn en registreert alleen het aantal argumentvelden. De in-memory lijst volgt het huidige browsertabblad, overleeft navigatie binnen de Control UI en reset bij het herladen van de pagina, wisselen van sessie of **Wissen**.

## Chatgedrag

<AccordionGroup>
  <Accordion title="Verzend- en geschiedenissemantiek">
    - `chat.send` is **niet-blokkerend**: het bevestigt onmiddellijk met `{ runId, status: "started" }` en de respons streamt via `chat`-events. Vertrouwde Control UI-clients kunnen ook optionele ACK-timingmetadata ontvangen voor lokale diagnostiek.
    - Chatuploads accepteren afbeeldingen plus niet-videobestanden. Afbeeldingen behouden het native afbeeldingspad; andere bestanden worden opgeslagen als beheerde media en in de geschiedenis getoond als bijlagelinks.
    - Opnieuw verzenden met dezelfde `idempotencyKey` retourneert `{ status: "in_flight" }` tijdens de uitvoering en `{ status: "ok" }` na voltooiing.
    - `chat.history`-responses zijn qua grootte begrensd voor UI-veiligheid. Wanneer transcriptitems te groot zijn, kan Gateway lange tekstvelden afkappen, zware metadatablokken weglaten en te grote berichten vervangen door een placeholder (`[chat.history omitted: message too large]`).
    - Wanneer een zichtbaar assistentbericht in `chat.history` is afgekapt, kan de zijlezer de volledige display-genormaliseerde transcriptentry op aanvraag ophalen via `chat.message.get` met `sessionKey`, actieve `agentId` wanneer nodig, en transcript-`messageId`. Als de Gateway nog steeds niet meer kan retourneren, toont de lezer een expliciete niet-beschikbaar-state in plaats van stilzwijgend de afgekorte preview te herhalen.
    - Door de assistent/gegenereerde afbeeldingen worden opgeslagen als beheerde mediareferenties en teruggeleverd via geauthenticeerde Gateway-media-URL's, zodat herladen niet afhankelijk is van raw base64-afbeeldingspayloads die in de chatgeschiedenisresponse blijven.
    - Bij het renderen van `chat.history` verwijdert de Control UI display-only inline directive tags uit zichtbare assistenttekst (bijvoorbeeld `[[reply_to_*]]` en `[[audio_as_voice]]`), plain-text XML-payloads van toolaanroepen (inclusief `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en afgekorte tool-call-blokken), en gelekte ASCII-/full-width-modelbesturingstokens, en laat assistentitems weg waarvan de volledige zichtbare tekst alleen het exacte stille token `NO_REPLY` / `no_reply` of het Heartbeat-bevestigingstoken `HEARTBEAT_OK` is.
    - Tijdens een actieve verzending en de laatste geschiedenisverversing houdt de chatweergave lokale optimistische gebruikers-/assistentberichten zichtbaar als `chat.history` kortstondig een oudere snapshot retourneert; het canonieke transcript vervangt die lokale berichten zodra de Gateway-geschiedenis is bijgewerkt.
    - Live `chat`-events zijn leveringsstate, terwijl `chat.history` opnieuw wordt opgebouwd uit het duurzame sessietranscript. Na tool-final-events laadt de Control UI de geschiedenis opnieuw en voegt alleen een kleine optimistische staart samen; de transcriptgrens is gedocumenteerd in [WebChat](/nl/web/webchat).
    - `chat.inject` voegt een assistentnotitie toe aan het sessietranscript en broadcast een `chat`-event voor alleen-UI-updates (geen agent-run, geen kanaallevering).
    - De zijbalk toont recente sessies met een Nieuwe sessie-actie, een Alle sessies-link en een sessiezoekknop die de volledige sessiekiezer opent (gescoped op de geselecteerde agent, met zoeken en paginering). Wisselen van agent toont alleen sessies die aan die agent zijn gekoppeld en valt terug op de hoofdsessie van die agent wanneer deze nog geen opgeslagen dashboardsessies heeft.
    - Elke rij in de sessiekiezer kan de sessie hernoemen, vastpinnen of archiveren. Een actieve run en de hoofdsessie van een agent kunnen niet worden gearchiveerd. Het archiveren van de momenteel geselecteerde sessie schakelt Chat terug naar de hoofdsessie van die agent.
    - Op desktopbreedtes blijven chatbedieningselementen op één compacte rij en klappen ze in tijdens omlaag scrollen door het transcript; omhoog scrollen, terugkeren naar de bovenkant of de onderkant bereiken herstelt de bedieningselementen.
    - Opeenvolgende dubbele tekst-only berichten renderen als één ballon met een telbadge. Berichten met afbeeldingen, bijlagen, tooluitvoer of canvaspreviews blijven niet ingeklapt.
    - De model- en thinking-kiezers in de chatheader patchen de actieve sessie onmiddellijk via `sessions.patch`; het zijn permanente sessie-overrides, geen verzendopties voor slechts één beurt.
    - Als je een bericht verzendt terwijl een modelkiezerwijziging voor dezelfde sessie nog wordt opgeslagen, wacht de composer op die sessiepatch voordat `chat.send` wordt aangeroepen, zodat de verzending het geselecteerde model gebruikt.
    - Het typen van `/new` in de Control UI maakt en schakelt over naar dezelfde nieuwe dashboardsessie als Nieuwe chat, behalve wanneer `session.dmScope: "main"` is geconfigureerd en de huidige parent de hoofdsessie van de agent is; in dat geval wordt de hoofdsessie ter plekke gereset. Het typen van `/reset` behoudt de expliciete in-place reset van de Gateway voor de huidige sessie.
    - De chatmodelkiezer vraagt de geconfigureerde modelweergave van de Gateway op. Als `agents.defaults.models` aanwezig is, stuurt die allowlist de kiezer aan, inclusief `provider/*`-items die provider-scoped catalogi dynamisch houden. Anders toont de kiezer expliciete `models.providers.*.models`-items plus providers met bruikbare auth. De volledige catalogus blijft beschikbaar via de debug-`models.list`-RPC met `view: "all"`.
    - Wanneer verse Gateway-sessiegebruiksrapporten huidige contexttokens bevatten, toont de werkbalk van de chatcomposer een kleine contextgebruiksring met het gebruikte percentage; de volledige tokendetails staan in de tooltip. De ring schakelt over naar waarschuwingsstijl bij hoge contextdruk en toont, op aanbevolen Compaction-niveaus, een compacte knop die het normale sessie-Compaction-pad uitvoert. Verouderde tokensnapshots worden verborgen totdat de Gateway opnieuw vers gebruik rapporteert.

  </Accordion>
  <Accordion title="Praatmodus (browser realtime)">
    Praatmodus gebruikt een geregistreerde realtime-spraakprovider. Configureer OpenAI met `talk.realtime.provider: "openai"` plus een `openai` API-key-authprofiel, `talk.realtime.providers.openai.apiKey` of `OPENAI_API_KEY`; OpenAI OAuth-profielen configureren geen Realtime-spraak. Configureer Google met `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey`. De browser ontvangt nooit een standaard provider-API-key. OpenAI ontvangt een tijdelijke Realtime-clientsecret voor WebRTC. Google Live ontvangt een eenmalig beperkt Live API-authtoken voor een browser-WebSocket-sessie, waarbij instructies en tooldeclaraties door de Gateway in het token zijn vastgelegd. Providers die alleen een backend realtime bridge beschikbaar stellen, lopen via het Gateway-relaytransport, zodat credentials en vendorsockets server-side blijven terwijl browseraudio via geauthenticeerde Gateway-RPC's beweegt. De Realtime-sessieprompt wordt door de Gateway samengesteld; `talk.client.create` accepteert geen door de aanroeper geleverde instructie-overrides.

    De Chat-composer bevat een knop Talk-opties naast de start/stop-knop voor Talk. De opties gelden voor de volgende Talk-sessie en kunnen provider, transport, model, stem, redeneerinspanning, VAD-drempel, stilteperiode en prefix-padding overschrijven. Wanneer een optie leeg is, gebruikt de Gateway geconfigureerde standaardwaarden waar beschikbaar, of anders de providerstandaard. Gateway relay selecteren dwingt het backend-relaypad af; WebRTC selecteren houdt de sessie in beheer van de client en laat deze mislukken in plaats van stilzwijgend terug te vallen op relay als de provider geen browsersessie kan maken.

    In de Chat-composer is de Talk-bediening de knop met golven naast de microfoonknop voor dicteren. Wanneer Talk start, toont de statusrij van de composer `Connecting Talk...`, daarna `Talk live` terwijl audio verbonden is, of `Asking OpenClaw...` terwijl een realtime toolaanroep het geconfigureerde grotere model raadpleegt via `talk.client.toolCall`.

    Live smoke voor maintainers: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifieert de OpenAI-backend WebSocket-bridge, OpenAI-browser WebRTC SDP-uitwisseling, Google Live browser-WebSocket-installatie met beperkte tokens, en de Gateway relay browseradapter met nep-microfoonmedia. De opdracht drukt alleen providerstatus af en logt geen geheimen.

  </Accordion>
  <Accordion title="Stop and abort">
    - Klik op **Stop** (roept `chat.abort` aan).
    - Terwijl een run actief is, worden normale vervolgberichten in de wachtrij geplaatst. Klik op **Steer** bij een bericht in de wachtrij om dat vervolgbericht in de lopende beurt te injecteren.
    - Typ `/stop` (of losse abortzinnen zoals `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) om buiten de normale band om af te breken.
    - `chat.abort` ondersteunt `{ sessionKey }` (geen `runId`) om alle actieve runs voor die sessie af te breken.

  </Accordion>
  <Accordion title="Abort partial retention">
    - Wanneer een run wordt afgebroken, kan gedeeltelijke assistenttekst nog steeds in de UI worden weergegeven.
    - Gateway bewaart afgebroken gedeeltelijke assistenttekst in de transcriptgeschiedenis wanneer er gebufferde uitvoer bestaat.
    - Bewaarde vermeldingen bevatten abortmetadata zodat transcriptconsumenten afgebroken gedeeltelijke uitvoer kunnen onderscheiden van normale voltooiingsuitvoer.

  </Accordion>
</AccordionGroup>

## PWA-installatie en Web Push

De Control UI levert een `manifest.webmanifest` en een serviceworker, zodat moderne browsers deze als zelfstandige PWA kunnen installeren. Web Push laat de Gateway de geïnstalleerde PWA wekken met meldingen, zelfs wanneer het tabblad of browservenster niet open is.

Als de pagina direct na een OpenClaw-update **Protocol mismatch** toont, open dan eerst het dashboard opnieuw met `openclaw dashboard` en voer een harde refresh van de pagina uit. Als het nog steeds mislukt, wis dan de sitegegevens voor de dashboard-origin of test in een privébrowservenster; een oud tabblad of browsercache van de serviceworker kan een Control UI-bundel van vóór de update blijven draaien tegen de nieuwere Gateway.

| Oppervlak                                             | Wat het doet                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA-manifest. Browsers bieden "App installeren" aan zodra het bereikbaar is. |
| `ui/public/sw.js`                                     | Serviceworker die `push`-events en meldingsklikken afhandelt. |
| `push/vapid-keys.json` (onder de OpenClaw-statusmap) | Automatisch gegenereerd VAPID-sleutelpaar om Web Push-payloads te ondertekenen. |
| `push/web-push-subscriptions.json`                    | Bewaarde browserabonnement-endpoints.                          |

Overschrijf het VAPID-sleutelpaar via omgevingsvariabelen op het Gateway-proces wanneer je sleutels wilt vastpinnen (voor multi-host-deployments, geheimrotatie of tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (standaard `https://openclaw.ai`)

De Control UI gebruikt deze scope-afgeschermde Gateway-methoden om browserabonnementen te registreren en te testen:

- `push.web.vapidPublicKey` — haalt de actieve openbare VAPID-sleutel op.
- `push.web.subscribe` — registreert een `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — verwijdert een geregistreerd endpoint.
- `push.web.test` — verstuurt een testmelding naar het abonnement van de aanroeper.

<Note>
Web Push staat los van het iOS APNS-relaypad (zie [Configuratie](/nl/gateway/configuration) voor push met relay-ondersteuning) en de bestaande methode `push.test`, die gericht zijn op native mobiele koppeling.
</Note>

## Gehoste embeds

Assistentberichten kunnen gehoste webcontent inline renderen met de shortcode `[embed ...]`. Het iframe-sandboxbeleid wordt geregeld door `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Schakelt scriptuitvoering binnen gehoste embeds uit.
  </Tab>
  <Tab title="scripts (default)">
    Staat interactieve embeds toe terwijl origin-isolatie behouden blijft; dit is de standaardwaarde en is meestal genoeg voor zelfstandige browserspellen/widgets.
  </Tab>
  <Tab title="trusted">
    Voegt `allow-same-origin` toe boven op `allow-scripts` voor documenten op dezelfde site die bewust sterkere privileges nodig hebben.
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
Gebruik `trusted` alleen wanneer het ingesloten document daadwerkelijk same-origin-gedrag nodig heeft. Voor de meeste door agents gegenereerde spellen en interactieve canvassen is `scripts` de veiligere keuze.
</Warning>

Absolute externe `http(s)`-embed-URL's blijven standaard geblokkeerd. Als je bewust wilt dat `[embed url="https://..."]` pagina's van derden laadt, stel dan `gateway.controlUi.allowExternalEmbedUrls: true` in.

## Breedte van chatberichten

Gegroepeerde chatberichten gebruiken standaard een leesbare maximale breedte. Deployments met brede monitoren kunnen dit overschrijven zonder gebundelde CSS te patchen door `gateway.controlUi.chatMessageMaxWidth` in te stellen:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

De waarde wordt gevalideerd voordat deze de browser bereikt. Ondersteunde waarden zijn gewone lengtes en percentages zoals `960px` of `82%`, plus begrensde breedte-expressies met `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` en `fit-content(...)`.

## Tailnet-toegang (aanbevolen)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Houd de Gateway op loopback en laat Tailscale Serve deze via HTTPS proxyen:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Open:

    - `https://<magicdns>/` (of je geconfigureerde `gateway.controlUi.basePath`)

    Standaard kunnen Control UI-/WebSocket Serve-aanvragen authenticeren via Tailscale-identiteitsheaders (`tailscale-user-login`) wanneer `gateway.auth.allowTailscale` `true` is. OpenClaw verifieert de identiteit door het adres `x-forwarded-for` op te lossen met `tailscale whois` en dit met de header te vergelijken, en accepteert deze alleen wanneer de aanvraag loopback bereikt met de `x-forwarded-*`-headers van Tailscale. Voor Control UI-operatorsessies met browserapparaatidentiteit slaat dit geverifieerde Serve-pad ook de roundtrip voor apparaatkoppeling over; browsers zonder apparaat en verbindingen met node-rol volgen nog steeds de normale apparaatcontroles. Stel `gateway.auth.allowTailscale: false` in als je expliciete gedeelde-geheimreferenties wilt vereisen, zelfs voor Serve-verkeer. Gebruik daarna `gateway.auth.mode: "token"` of `"password"`.

    Voor dat asynchrone Serve-identiteitspad worden mislukte authenticatiepogingen voor hetzelfde client-IP en dezelfde auth-scope geserialiseerd voordat rate-limit-writes plaatsvinden. Gelijktijdige slechte nieuwe pogingen vanuit dezelfde browser kunnen daarom bij de tweede aanvraag `retry later` tonen in plaats van twee gewone mismatches die parallel racen.

    <Warning>
    Tokenloze Serve-authenticatie veronderstelt dat de gatewayhost vertrouwd is. Als niet-vertrouwde lokale code op die host kan draaien, vereis dan token-/wachtwoordauthenticatie.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Open daarna:

    - `http://<tailscale-ip>:18789/` (of je geconfigureerde `gateway.controlUi.basePath`)

    Plak het overeenkomende gedeelde geheim in de UI-instellingen (verzonden als `connect.params.auth.token` of `connect.params.auth.password`).

  </Tab>
</Tabs>

## Onveilige HTTP

Als je het dashboard opent via gewone HTTP (`http://<lan-ip>` of `http://<tailscale-ip>`), draait de browser in een **niet-beveiligde context** en blokkeert WebCrypto. Standaard **blokkeert** OpenClaw Control UI-verbindingen zonder apparaatidentiteit.

Gedocumenteerde uitzonderingen:

- localhost-only onveilige-HTTP-compatibiliteit met `gateway.controlUi.allowInsecureAuth=true`
- geslaagde operator-Control UI-authenticatie via `gateway.auth.mode: "trusted-proxy"`
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Aanbevolen oplossing:** gebruik HTTPS (Tailscale Serve) of open de UI lokaal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (op de gatewayhost)

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

    `allowInsecureAuth` is alleen een lokale compatibiliteitsschakelaar:

    - Deze staat localhost-Control UI-sessies toe om door te gaan zonder apparaatidentiteit in niet-beveiligde HTTP-contexten.
    - Deze omzeilt geen koppelingscontroles.
    - Deze versoepelt geen vereisten voor apparaatidentiteit op afstand (niet-localhost).

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
    - Geslaagde trusted-proxy-authenticatie kan **operator**-Control UI-sessies toelaten zonder apparaatidentiteit.
    - Dit geldt **niet** voor Control UI-sessies met node-rol.
    - Reverse proxies op same-host loopback voldoen nog steeds niet aan trusted-proxy-authenticatie; zie [Trusted proxy-authenticatie](/nl/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Zie [Tailscale](/nl/gateway/tailscale) voor richtlijnen voor HTTPS-installatie.

## Contentbeveiligingsbeleid

De Control UI wordt geleverd met een strikt `img-src`-beleid: alleen assets van **same-origin**, `data:`-URL's en lokaal gegenereerde `blob:`-URL's zijn toegestaan. Externe `http(s)`- en protocolrelatieve afbeeldings-URL's worden door de browser geweigerd en veroorzaken geen netwerkverzoeken.

Wat dit in de praktijk betekent:

- Avatars en afbeeldingen die via relatieve paden worden aangeboden (bijvoorbeeld `/avatars/<id>`) renderen nog steeds, inclusief geauthenticeerde avatarroutes die de UI ophaalt en omzet in lokale `blob:`-URL's.
- Inline `data:image/...`-URL's renderen nog steeds (nuttig voor payloads binnen het protocol).
- Lokale `blob:`-URL's die door de Control UI zijn gemaakt, renderen nog steeds.
- Externe avatar-URL's die door kanaalmetadata worden uitgegeven, worden gestript in de avatarhelpers van de Control UI en vervangen door het ingebouwde logo/de badge, zodat een gecompromitteerd of kwaadaardig kanaal geen willekeurige externe afbeeldingsverzoeken vanuit een operatorbrowser kan afdwingen.

Je hoeft niets te wijzigen om dit gedrag te krijgen — het staat altijd aan en is niet configureerbaar.

## Authenticatie voor avatarroute

Wanneer gateway-authenticatie is geconfigureerd, vereist het avatar-endpoint van de Control UI hetzelfde gateway-token als de rest van de API:

- `GET /avatar/<agentId>` retourneert de avatarafbeelding alleen aan geauthenticeerde aanroepers. `GET /avatar/<agentId>?meta=1` retourneert de avatarmetadata volgens dezelfde regel.
- Niet-geauthenticeerde aanvragen naar beide routes worden geweigerd (net als bij de aangrenzende assistant-media-route). Dit voorkomt dat de avatarroute agentidentiteit lekt op hosts die verder beschermd zijn.
- De Control UI zelf stuurt het gateway-token door als bearer-header bij het ophalen van avatars, en gebruikt geauthenticeerde blob-URL's zodat de afbeelding nog steeds in dashboards rendert.

Als je Gateway-auth uitschakelt (niet aanbevolen op gedeelde hosts), wordt de avatarroute ook niet-geauthenticeerd, in lijn met de rest van de Gateway.

## Auth voor mediaroute van assistent

Wanneer Gateway-auth is geconfigureerd, gebruiken lokale mediavoorbeelden van de assistent een route in twee stappen:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` vereist de normale operatorauth van de Control UI. De browser verzendt het Gateway-token als bearer-header bij het controleren van beschikbaarheid.
- Geslaagde metadata-antwoorden bevatten een kortlevend `mediaTicket` dat is beperkt tot dat exacte bronpad.
- Door de browser gerenderde URL's voor afbeeldingen, audio, video en documenten gebruiken `mediaTicket=<ticket>` in plaats van het actieve Gateway-token of wachtwoord. Het ticket verloopt snel en kan geen andere bron autoriseren.

Zo blijft normale mediaweergave compatibel met browser-native media-elementen zonder herbruikbare Gateway-inloggegevens in zichtbare media-URL's te plaatsen.

## De UI bouwen

De Gateway serveert statische bestanden uit `dist/control-ui`. Bouw ze met:

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

Wijs de UI daarna naar je Gateway WS-URL (bijv. `ws://127.0.0.1:18789`).

## Lege Control UI-pagina

Als de browser een leeg dashboard laadt en DevTools geen bruikbare fout toont, heeft een extensie of vroeg content script mogelijk voorkomen dat de JavaScript-module-app werd geëvalueerd. De statische pagina bevat een eenvoudig HTML-herstelpaneel dat verschijnt wanneer `<openclaw-app>` na het opstarten niet is geregistreerd.

Gebruik de actie **Opnieuw proberen** in het paneel nadat je de browseromgeving hebt gewijzigd, of laad handmatig opnieuw na deze controles:

- Schakel extensies uit die in alle pagina's injecteren, vooral extensies met `<all_urls>`-content scripts.
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
  <Step title="Open met gatewayUrl">
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
    - Als je een volledig `ws://`- of `wss://`-endpoint via `gatewayUrl` doorgeeft, URL-encode dan de waarde van `gatewayUrl` zodat de browser de querystring correct parseert.
    - `token` moet waar mogelijk via het URL-fragment (`#token=...`) worden doorgegeven. Fragmenten worden niet naar de server verzonden, waardoor lekkage via request-logs en Referer wordt voorkomen. Verouderde `?token=`-queryparameters worden voor compatibiliteit nog eenmalig geïmporteerd, maar alleen als fallback, en worden direct na bootstrap verwijderd.
    - `password` wordt alleen in het geheugen bewaard.
    - Wanneer `gatewayUrl` is ingesteld, valt de UI niet terug op inloggegevens uit configuratie of omgeving. Geef `token` (of `password`) expliciet op. Ontbrekende expliciete inloggegevens zijn een fout.
    - Gebruik `wss://` wanneer de Gateway achter TLS staat (Tailscale Serve, HTTPS-proxy, enz.).
    - `gatewayUrl` wordt alleen geaccepteerd in een venster op topniveau (niet ingesloten) om clickjacking te voorkomen.
    - Publieke niet-loopback Control UI-implementaties moeten `gateway.controlUi.allowedOrigins` expliciet instellen (volledige origins). Privé same-origin LAN/Tailnet-ladingen vanaf loopback, RFC1918/link-local, `.local`, `.ts.net` of Tailscale CGNAT-hosts worden geaccepteerd zonder Host-header-fallback in te schakelen.
    - Het opstarten van de Gateway kan lokale origins zoals `http://localhost:<port>` en `http://127.0.0.1:<port>` seeden vanuit de effectieve runtime-bind en poort, maar externe browser-origins hebben nog steeds expliciete vermeldingen nodig.
    - Gebruik `gateway.controlUi.allowedOrigins: ["*"]` niet, behalve voor strikt gecontroleerde lokale tests. Het betekent elke browser-origin toestaan, niet "match de host die ik gebruik."
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

Details voor externe toegang instellen: [Externe toegang](/nl/gateway/remote).

## Gerelateerd

- [Dashboard](/nl/web/dashboard) — Gateway-dashboard
- [Gezondheidscontroles](/nl/gateway/health) — gezondheidsbewaking van de Gateway
- [TUI](/nl/web/tui) — terminalgebruikersinterface
- [WebChat](/nl/web/webchat) — browsergebaseerde chatinterface
