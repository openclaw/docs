---
read_when:
    - Je wilt de Gateway vanuit een browser bedienen
    - Je wilt Tailnet-toegang zonder SSH-tunnels
sidebarTitle: Control UI
summary: Browsergebaseerde beheerinterface voor de Gateway (chat, activiteit, knooppunten, configuratie)
title: Control-UI
x-i18n:
    generated_at: "2026-06-27T18:32:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc8b9675454d57bbfb6be10bb7ef94152a89a72c94affdf72be8c79cf14cbb08
    source_path: web/control-ui.md
    workflow: 16
---

De bedienings-UI is een kleine **Vite + Lit**-single-page-app die door de Gateway wordt geserveerd:

- standaard: `http://<host>:18789/`
- optioneel prefix: stel `gateway.controlUi.basePath` in (bijv. `/openclaw`)

Deze communiceert **rechtstreeks met de Gateway-WebSocket** op dezelfde poort.

## Snel openen (lokaal)

Als de Gateway op dezelfde computer draait, open dan:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (of [http://localhost:18789/](http://localhost:18789/))

Als de pagina niet laadt, start dan eerst de Gateway: `openclaw gateway`.

Authenticatie wordt tijdens de WebSocket-handshake geleverd via:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve-identiteitsheaders wanneer `gateway.auth.allowTailscale: true`
- trusted-proxy-identiteitsheaders wanneer `gateway.auth.mode: "trusted-proxy"`

Het instellingenpaneel van het dashboard bewaart een token voor de huidige browsertabsessie en de geselecteerde gateway-URL; wachtwoorden worden niet bewaard. Onboarding genereert meestal een gateway-token voor authenticatie met gedeeld geheim bij de eerste verbinding, maar wachtwoordauthenticatie werkt ook wanneer `gateway.auth.mode` `"password"` is.

## Apparaatkoppeling (eerste verbinding)

Wanneer je vanaf een nieuwe browser of nieuw apparaat verbinding maakt met de bedienings-UI, vereist de Gateway meestal een **eenmalige koppelingsgoedkeuring**. Dit is een beveiligingsmaatregel om ongeautoriseerde toegang te voorkomen.

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

Als de browser opnieuw probeert te koppelen met gewijzigde authenticatiegegevens (rol/scopes/openbare sleutel), wordt de vorige openstaande aanvraag vervangen en wordt er een nieuwe `requestId` aangemaakt. Voer `openclaw devices list` opnieuw uit vóór goedkeuring.

Als de browser al is gekoppeld en je deze wijzigt van leestoegang naar schrijf-/admin-toegang, wordt dit behandeld als een goedkeuringsupgrade, niet als een stille herverbinding. OpenClaw houdt de oude goedkeuring actief, blokkeert de bredere herverbinding en vraagt je om de nieuwe scopereeks expliciet goed te keuren.

Na goedkeuring wordt het apparaat onthouden en is hernieuwde goedkeuring niet nodig, tenzij je het intrekt met `openclaw devices revoke --device <id> --role <role>`. Zie [Apparaten-CLI](/nl/cli/devices) voor tokenrotatie en intrekking.

Paperclip-agents die verbinding maken via de `openclaw_gateway`-adapter gebruiken dezelfde goedkeuringsflow bij eerste gebruik. Voer na de eerste verbindingspoging `openclaw devices approve --latest` uit om de openstaande aanvraag te bekijken en voer daarna de afgedrukte opdracht `openclaw devices approve <requestId>` opnieuw uit om deze goed te keuren. Geef expliciete `--url`- en `--token`-waarden door voor een externe gateway. Configureer een persistente `adapterConfig.devicePrivateKeyPem` in Paperclip in plaats van bij elke run een nieuwe tijdelijke apparaatidentiteit te laten genereren, zodat goedkeuringen stabiel blijven tussen herstarts.

<Note>
- Directe local loopback-browserverbindingen (`127.0.0.1` / `localhost`) worden automatisch goedgekeurd.
- Tailscale Serve kan de koppelingsrondgang voor operatorsessies van de bedienings-UI overslaan wanneer `gateway.auth.allowTailscale: true`, de Tailscale-identiteit is geverifieerd en de browser zijn apparaatidentiteit presenteert.
- Directe Tailnet-bindingen, LAN-browserverbindingen en browserprofielen zonder apparaatidentiteit vereisen nog steeds expliciete goedkeuring.
- Elk browserprofiel genereert een unieke apparaat-ID, dus wisselen van browser of het wissen van browsergegevens vereist opnieuw koppelen.

</Note>

  ## Persoonlijke identiteit (browserlokaal)

  De Control UI ondersteunt een persoonlijke identiteit per browser (weergavenaam en avatar) die aan uitgaande berichten wordt gekoppeld voor attributie in gedeelde sessies. Deze leeft in browseropslag, is beperkt tot het huidige browserprofiel en wordt niet gesynchroniseerd naar andere apparaten of serverzijdig bewaard, behalve de normale auteurschapsmetadata in transcripties van berichten die je daadwerkelijk verzendt. Als je sitegegevens wist of van browser wisselt, wordt deze weer leeg.

  Hetzelfde browserlokale patroon geldt voor de overschrijving van de assistentavatar. Geüploade assistentavatars leggen de door de Gateway opgeloste identiteit alleen over de lokale browser heen en maken nooit een retourronde via `config.patch`. Het gedeelde configuratieveld `ui.assistant.avatar` blijft beschikbaar voor niet-UI-clients die het veld rechtstreeks schrijven, zoals gescripte gateways of aangepaste dashboards.

  ## Runtimeconfiguratie-endpoint

  De Control UI haalt zijn runtime-instellingen op uit `/control-ui-config.json`, opgelost relatief ten opzichte van het Control UI-basispad van de gateway (bijvoorbeeld `/__openclaw__/control-ui-config.json` wanneer de UI onder `/__openclaw__/` wordt aangeboden). Dat endpoint wordt afgeschermd door dezelfde gateway-authenticatie als de rest van het HTTP-oppervlak: niet-geauthenticeerde browsers kunnen het niet ophalen, en een succesvolle ophaalactie vereist een al geldige gateway-token/wachtwoord, Tailscale Serve-identiteit of vertrouwde-proxy-identiteit.

  ## Taalondersteuning

  De Control UI kan zichzelf bij de eerste laadactie lokaliseren op basis van je browserlocale. Om dit later te overschrijven, open je **Overzicht -> Gateway-toegang -> Taal**. De locale-kiezer staat in de Gateway-toegangskaart, niet onder Weergave.

  - Ondersteunde locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
  - Niet-Engelse vertalingen worden lazy-loaded in de browser.
  - De geselecteerde locale wordt opgeslagen in browseropslag en hergebruikt bij toekomstige bezoeken.
  - Ontbrekende vertaalsleutels vallen terug op Engels.

  Docs-vertalingen worden gegenereerd voor dezelfde niet-Engelse localeset, maar de ingebouwde Mintlify-taalkiezer van de docs-site is beperkt tot de locale-codes die Mintlify accepteert. Thaise (`th`) en Perzische (`fa`) docs worden nog steeds gegenereerd in de publicatierepo; ze verschijnen mogelijk pas in die kiezer wanneer Mintlify die codes ondersteunt.

  ## Weergavethema's

  Het Weergavepaneel behoudt de ingebouwde Claw-, Knot- en Dash-thema's, plus één browserlokale tweakcn-importsleuf. Om een thema te importeren, open je de [tweakcn-editor](https://tweakcn.com/editor/theme), kies of maak je een thema, klik je op **Delen** en plak je de gekopieerde themalink in Weergave. De importeur accepteert ook `https://tweakcn.com/r/themes/<id>`-registry-URL's, editor-URL's zoals `https://tweakcn.com/editor/theme?theme=amethyst-haze`, relatieve `/themes/<id>`-paden, ruwe thema-ID's en standaardthemanamen zoals `amethyst-haze`.

  Weergave bevat ook een browserlokale instelling voor tekstgrootte. De instelling wordt samen met de rest van de Control UI-voorkeuren opgeslagen, is van toepassing op chattekst, composertekst, toolkaarten en chatzijbalken, en houdt tekstinvoer minimaal 16px zodat mobiele Safari niet automatisch inzoomt bij focus.

  Geïmporteerde thema's worden alleen in het huidige browserprofiel opgeslagen. Ze worden niet naar gatewayconfiguratie geschreven en synchroniseren niet tussen apparaten. Het vervangen van het geïmporteerde thema werkt de ene lokale sleuf bij; het wissen ervan zet het actieve thema terug naar Claw als het geïmporteerde thema was geselecteerd.

  ## Wat het kan doen (vandaag)

  <AccordionGroup>
  <Accordion title="Chatten en praten">
    - Chat met het model via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Vernieuwingen van de chatgeschiedenis vragen een begrensd recent venster op met tekstlimieten per bericht, zodat grote sessies de browser niet dwingen een volledige transcriptpayload te renderen voordat de chat bruikbaar wordt.
    - Praat via realtime browsersessies. OpenAI gebruikt directe WebRTC, Google Live gebruikt een beperkte eenmalige browsertoken via WebSocket, en realtime spraakplugins die alleen in de backend draaien gebruiken het Gateway-relaytransport. Door de client beheerde providersessies starten met `talk.client.create`; Gateway-relaysessies starten met `talk.session.create`. De relay houdt providerreferenties op de Gateway terwijl de browser microfoon-PCM streamt via `talk.session.appendAudio`, stuurt `openclaw_agent_consult`-providertoolaanroepen door via `talk.client.toolCall` voor Gateway-beleid en het grotere geconfigureerde OpenClaw-model, en routeert spraaksturing voor actieve runs via `talk.client.steer` of `talk.session.steer`.
    - Stream toolaanroepen en live tooluitvoerkaarten in Chat (agentevents).
    - Activiteitstabblad met browserlokale, redactie-eerst-samenvattingen van live toolactiviteit uit bestaande `session.tool`- / tooleventlevering.

  </Accordion>
  <Accordion title="Kanalen, instanties, sessies, dromen">
    - Kanalen: ingebouwde plus gebundelde/externe pluginkanaalstatus, QR-login en configuratie per kanaal (`channels.status`, `web.login.*`, `config.patch`).
    - Kanaalprobe-vernieuwingen houden de vorige momentopname zichtbaar terwijl trage providercontroles afronden, en gedeeltelijke momentopnamen worden gelabeld wanneer een probe of audit het UI-budget overschrijdt.
    - Instanties: aanwezigheidslijst en vernieuwing (`system-presence`).
    - Sessies: toon standaard sessies van geconfigureerde agents, val terug vanaf verouderde sessiesleutels van niet-geconfigureerde agents, en pas model-/thinking-/fast-/verbose-/trace-/reasoning-overschrijvingen per sessie toe (`sessions.list`, `sessions.patch`).
    - Dromen: dreaming-status, in-/uitschakelknop en Dream Diary-lezer (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, Nodes, exec-goedkeuringen">
    - Cron-taken: tonen/toevoegen/bewerken/uitvoeren/inschakelen/uitschakelen plus uitvoeringsgeschiedenis (`cron.*`).
    - Skills: status, inschakelen/uitschakelen, installeren, API-sleutelupdates (`skills.*`).
    - Nodes: lijst en limieten (`node.list`).
    - Exec-goedkeuringen: gateway- of node-toestaanlijsten bewerken plus vraagbeleid voor `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuratie">
    - Bekijk/bewerk `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP heeft een eigen instellingenpagina voor geconfigureerde servers, inschakeling, OAuth-/filter-/parallelle samenvattingen, algemene operatorcommando's en de gescopeerde `mcp`-configuratie-editor.
    - Toepassen en herstarten met validatie (`config.apply`) en de laatst actieve sessie wekken.
    - Schrijfacties bevatten een base-hashbeveiliging om te voorkomen dat gelijktijdige bewerkingen worden overschreven.
    - Schrijfacties (`config.set`/`config.apply`/`config.patch`) voeren vooraf actieve SecretRef-resolutie uit voor referenties in de ingediende configuratiepayload; niet-opgeloste actieve ingediende referenties worden vóór het schrijven geweigerd.
    - Formulieropslagen verwijderen verouderde geredigeerde placeholders die niet uit de opgeslagen configuratie kunnen worden hersteld, terwijl geredigeerde waarden behouden blijven die nog steeds naar opgeslagen geheimen verwijzen.
    - Schema- en formulierweergave (`config.schema` / `config.schema.lookup`, inclusief veld `title` / `description`, overeenkomende UI-hints, directe kindsamenvattingen, docs-metadata op geneste object-/wildcard-/array-/compositienodes, plus plugin- en kanaalschema's wanneer beschikbaar); de Raw JSON-editor is alleen beschikbaar wanneer de momentopname een veilige ruwe retourronde heeft.
    - Als een momentopname ruwe tekst niet veilig heen en terug kan verwerken, dwingt Control UI de formuliermodus af en schakelt Raw-modus voor die momentopname uit.
    - Raw JSON-editor "Terugzetten naar opgeslagen" behoudt de ruwe auteursvorm (opmaak, opmerkingen, `$include`-layout) in plaats van een afgevlakte momentopname opnieuw te renderen, zodat externe bewerkingen een reset overleven wanneer de momentopname veilig heen en terug kan worden verwerkt.
    - Gestructureerde SecretRef-objectwaarden worden alleen-lezen weergegeven in tekstinvoer van formulieren om onbedoelde object-naar-string-corruptie te voorkomen.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debug: status-/health-/modelmomentopnamen plus eventlogboek plus handmatige RPC-aanroepen (`status`, `health`, `models.list`).
    - Het eventlogboek bevat Control UI-vernieuwings-/RPC-timings, trage chat-/configuratierenderingstimings en vermeldingen over browserresponsiviteit voor lange animatieframes of lange taken wanneer de browser die PerformanceObserver-entrytypen beschikbaar stelt.
    - Logs: live tail van gatewaybestandslogs met filter/export (`logs.tail`).
    - Update: voer een package-/git-update plus herstart uit (`update.run`) met een herstartrapport, en poll daarna `update.status` na opnieuw verbinden om de actieve gatewayversie te verifiëren.

  </Accordion>
  <Accordion title="Opmerkingen bij Cron-taakpaneel">
    - Voor geïsoleerde taken is de standaardlevering een aankondigingssamenvatting. Je kunt overschakelen naar geen als je alleen interne runs wilt.
    - Kanaal-/doelvelden verschijnen wanneer aankondigen is geselecteerd.
    - Webhook-modus gebruikt `delivery.mode = "webhook"` met `delivery.to` ingesteld op een geldige HTTP(S)-webhook-URL.
    - Voor hoofdsessietaken zijn Webhook- en geen-leveringsmodi beschikbaar.
    - Geavanceerde bewerkingsopties omvatten verwijderen na run, agent-override wissen, exacte/gespreide Cron-opties, overrides voor agentmodel/denkmodus en schakelaars voor best-effort-levering.
    - Formuliervalidatie gebeurt inline met fouten op veldniveau; ongeldige waarden schakelen de knop Opslaan uit totdat ze zijn hersteld.
    - Stel `cron.webhookToken` in om een specifieke bearer-token te verzenden; als dit wordt weggelaten, wordt de Webhook zonder auth-header verzonden.
    - Verouderde fallback: voer `openclaw doctor --fix` uit om opgeslagen legacy taken met `notify: true` te migreren van `cron.webhook` naar expliciete Webhook- of voltooiingslevering per taak.

  </Accordion>
</AccordionGroup>

## MCP-pagina

De speciale MCP-pagina is een operatorweergave voor door OpenClaw beheerde MCP-servers onder `mcp.servers`. Deze start zelf geen MCP-transports; gebruik deze om opgeslagen configuratie te inspecteren en te bewerken, en gebruik daarna `openclaw mcp doctor --probe` wanneer je live serverbewijs nodig hebt.

Typische workflow:

1. Open **MCP** vanuit de zijbalk.
2. Controleer de samenvattingskaarten voor het totale aantal servers en het aantal ingeschakelde, OAuth- en gefilterde servers.
3. Bekijk elke serverrij op transport, inschakeling, auth, filters, time-outs en opdrachthints.
4. Schakel inschakeling om wanneer een server geconfigureerd moet blijven maar buiten runtime-discovery moet blijven.
5. Bewerk de afgebakende configuratiesectie `mcp` voor serverdefinities, headers, TLS-/mTLS-paden, OAuth-metadata, toolfilters en Codex-projectiemetadata.
6. Gebruik **Opslaan** voor het wegschrijven van configuratie, of **Opslaan en publiceren** wanneer de draaiende Gateway de gewijzigde configuratie moet toepassen.
7. Voer `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` of `openclaw mcp reload` uit vanuit een terminal wanneer het bewerkte proces statische diagnostiek, live bewijs of verwijdering van gecachete runtime nodig heeft.

De pagina maskeert URL-achtige waarden die referenties bevatten vóór weergave en zet servernamen tussen aanhalingstekens in opdrachtfragmenten, zodat gekopieerde opdrachten nog steeds werken met spaties of shell-metatekens. De volledige CLI- en configuratiereferentie staat in [MCP](/nl/cli/mcp).

## Tabblad Activiteit

Het tabblad Activiteit is een vluchtige, browserlokale observator voor live toolactiviteit. Het is afgeleid van dezelfde Gateway-`session.tool`-/tool-eventstream die de Chat-toolkaarten aandrijft; het voegt geen andere Gateway-eventfamilie, endpoint, duurzame activiteitenopslag, metrics-feed of externe observatorstream toe.

Activiteitsitems bewaren alleen opgeschoonde samenvattingen en gemaskeerde, ingekorte uitvoervoorbeelden. Waarden van toolargumenten worden niet opgeslagen in de Activiteit-status; de UI laat zien dat argumenten verborgen zijn en registreert alleen het aantal argumentvelden. De in-memory lijst volgt het huidige browsertabblad, blijft behouden bij navigatie binnen de Control UI en wordt opnieuw ingesteld bij het herladen van de pagina, wisselen van sessie of **Wissen**.

## Chatgedrag

<AccordionGroup>
  <Accordion title="Semantiek van verzenden en geschiedenis">
    - `chat.send` is **niet-blokkerend**: het bevestigt onmiddellijk met `{ runId, status: "started" }` en de respons streamt via `chat`-events. Vertrouwde Control UI-clients kunnen ook optionele ACK-timingmetadata ontvangen voor lokale diagnostiek.
    - Chat-uploads accepteren afbeeldingen plus niet-videobestanden. Afbeeldingen behouden het native afbeeldingspad; andere bestanden worden opgeslagen als beheerde media en in de geschiedenis getoond als bijlagelinks.
    - Opnieuw verzenden met dezelfde `idempotencyKey` retourneert `{ status: "in_flight" }` zolang de run actief is, en `{ status: "ok" }` na voltooiing.
    - `chat.history`-responses zijn in grootte begrensd voor UI-veiligheid. Wanneer transcriptitems te groot zijn, kan Gateway lange tekstvelden inkorten, zware metadatablokken weglaten en te grote berichten vervangen door een placeholder (`[chat.history omitted: message too large]`).
    - Wanneer een zichtbaar assistentbericht in `chat.history` is ingekort, kan de zijlezer het volledige, voor weergave genormaliseerde transcriptitem op verzoek ophalen via `chat.message.get` met `sessionKey`, actieve `agentId` wanneer nodig, en transcript-`messageId`. Als de Gateway nog steeds niet meer kan retourneren, toont de lezer een expliciete niet-beschikbare status in plaats van stilzwijgend het ingekorte voorbeeld te herhalen.
    - Door de assistent gegenereerde afbeeldingen worden vastgelegd als beheerde mediareferenties en teruggeleverd via geauthenticeerde Gateway-media-URL's, zodat herladen niet afhankelijk is van onbewerkte base64-afbeeldingspayloads die in de chatgeschiedenisrespons blijven staan.
    - Bij het renderen van `chat.history` verwijdert de Control UI inline directive-tags die alleen voor weergave zijn uit zichtbare assistenttekst (bijvoorbeeld `[[reply_to_*]]` en `[[audio_as_voice]]`), XML-payloads voor toolcalls als platte tekst (waaronder `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en ingekorte toolcallblokken), en gelekte ASCII-/full-width-modelcontroletokens, en laat assistentitems weg waarvan de volledige zichtbare tekst alleen het exacte stille token `NO_REPLY` / `no_reply` of het Heartbeat-bevestigingstoken `HEARTBEAT_OK` is.
    - Tijdens een actieve verzending en de laatste geschiedenisverversing houdt de chatweergave lokale optimistische gebruikers-/assistentberichten zichtbaar als `chat.history` kort een oudere snapshot retourneert; het canonieke transcript vervangt die lokale berichten zodra de Gateway-geschiedenis is bijgewerkt.
    - Live `chat`-events zijn leveringsstatus, terwijl `chat.history` opnieuw wordt opgebouwd uit het duurzame sessietranscript. Na tool-final-events herlaadt de Control UI de geschiedenis en voegt alleen een kleine optimistische staart samen; de transcriptgrens is gedocumenteerd in [WebChat](/nl/web/webchat).
    - `chat.inject` voegt een assistentnotitie toe aan het sessietranscript en broadcast een `chat`-event voor alleen-UI-updates (geen agentrun, geen kanaallevering).
    - De chatkop toont het agentfilter vóór de sessiekiezer, en de sessiekiezer is afgebakend door de geselecteerde agent. Bij het wisselen van agenten worden alleen sessies getoond die aan die agent zijn gekoppeld, en wordt teruggevallen op de hoofdsessie van die agent wanneer deze nog geen opgeslagen dashboardsessies heeft.
    - Op desktopbreedtes blijven chatbedieningselementen op één compacte rij en klappen ze in tijdens omlaag scrollen door het transcript; omhoog scrollen, terugkeren naar de top of de onderkant bereiken herstelt de bedieningselementen.
    - Opeenvolgende dubbele berichten met alleen tekst worden weergegeven als één bubbel met een aantalsbadge. Berichten met afbeeldingen, bijlagen, tooluitvoer of canvasvoorbeelden worden niet samengevouwen.
    - De model- en denkkiezers in de chatkop patchen de actieve sessie onmiddellijk via `sessions.patch`; het zijn persistente sessie-overrides, geen verzendopties voor slechts één beurt.
    - Als je een bericht verzendt terwijl een wijziging in de modelkiezer voor dezelfde sessie nog wordt opgeslagen, wacht de composer op die sessiepatch voordat `chat.send` wordt aangeroepen, zodat de verzending het geselecteerde model gebruikt.
    - Het typen van `/new` in de Control UI maakt dezelfde nieuwe dashboardsessie aan als Nieuwe chat en schakelt daarnaartoe, behalve wanneer `session.dmScope: "main"` is geconfigureerd en de huidige ouder de hoofdsessie van de agent is; in dat geval wordt de hoofdsessie ter plekke opnieuw ingesteld. Het typen van `/reset` behoudt de expliciete in-place reset van de Gateway voor de huidige sessie.
    - De chatmodelkiezer vraagt de geconfigureerde modelweergave van de Gateway op. Als `agents.defaults.models` aanwezig is, stuurt die allowlist de kiezer aan, inclusief `provider/*`-items die providerspecifieke catalogi dynamisch houden. Anders toont de kiezer expliciete `models.providers.*.models`-items plus providers met bruikbare auth. De volledige catalogus blijft beschikbaar via de debug-`models.list`-RPC met `view: "all"`.
    - Wanneer verse Gateway-sessiegebruiksrapporten huidige contexttokens bevatten, toont het chatcomposergebied een compacte contextgebruiksindicator. Deze schakelt over naar waarschuwingsopmaak bij hoge contextdruk en toont, bij aanbevolen Compaction-niveaus, een compacte knop die het normale sessie-Compaction-pad uitvoert. Verouderde tokensnapshots worden verborgen totdat de Gateway opnieuw vers gebruik rapporteert.

  </Accordion>
  <Accordion title="Talk-modus (browser-realtime)">
    Talk-modus gebruikt een geregistreerde realtime spraakprovider. Configureer OpenAI met `talk.realtime.provider: "openai"` plus een `openai`-authprofiel met API-sleutel, `talk.realtime.providers.openai.apiKey` of `OPENAI_API_KEY`; OpenAI OAuth-profielen configureren geen realtime spraak. Configureer Google met `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey`. De browser ontvangt nooit een standaard API-sleutel van de provider. OpenAI ontvangt een tijdelijke Realtime-clientsecret voor WebRTC. Google Live ontvangt een eenmalig beperkt Live API-auth-token voor een browser-WebSocket-sessie, waarbij instructies en tooldeclaraties door de Gateway in het token zijn vergrendeld. Providers die alleen een backend-realtimebridge aanbieden, lopen via het Gateway-relaytransport, zodat referenties en vendorsockets server-side blijven terwijl browseraudio via geauthenticeerde Gateway-RPC's loopt. De Realtime-sessieprompt wordt samengesteld door de Gateway; `talk.client.create` accepteert geen door de aanroeper geleverde instructie-overrides.

    De Chat-composer bevat een Talk-optieknop naast de Talk-start-/stopknop. De opties gelden voor de volgende Talk-sessie en kunnen provider, transport, model, stem, reasoning effort, VAD-drempel, stilteduur en prefixpadding overriden. Wanneer een optie leeg is, gebruikt de Gateway geconfigureerde standaarden waar beschikbaar of de providerstandaard. Gateway-relay selecteren dwingt het backend-relaypad af; WebRTC selecteren houdt de sessie in bezit van de client en faalt in plaats van stilzwijgend terug te vallen op relay als de provider geen browsersessie kan maken.

    In de Chat-composer is de Talk-bediening de golvenknop naast de microfoonknop voor dicteren. Wanneer Talk start, toont de composerstatusrij `Connecting Talk...`, daarna `Talk live` terwijl audio is verbonden, of `Asking OpenClaw...` terwijl een realtime toolcall het geconfigureerde grotere model raadpleegt via `talk.client.toolCall`.

    Maintainer live smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifieert de OpenAI-backend-WebSocket-bridge, OpenAI-browser-WebRTC-SDP-uitwisseling, Google Live constrained-token-browser-WebSocket-setup en de Gateway-relaybrowseradapter met nep-microfoonmedia. De opdracht drukt alleen providerstatus af en logt geen geheimen.

  </Accordion>
  <Accordion title="Stoppen en afbreken">
    - Klik op **Stop** (roept `chat.abort` aan).
    - Terwijl een run actief is, worden normale follow-ups in de wachtrij gezet. Klik op **Sturen** bij een bericht in de wachtrij om die follow-up in de lopende beurt te injecteren.
    - Typ `/stop` (of zelfstandige afbreekzinnen zoals `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) om buiten de band af te breken.
    - `chat.abort` ondersteunt `{ sessionKey }` (geen `runId`) om alle actieve runs voor die sessie af te breken.

  </Accordion>
  <Accordion title="Gedeeltelijk behoud na afbreken">
    - Wanneer een run wordt afgebroken, kan gedeeltelijke assistenttekst nog steeds in de UI worden getoond.
    - Gateway legt afgebroken gedeeltelijke assistenttekst vast in transcriptgeschiedenis wanneer gebufferde uitvoer bestaat.
    - Vastgelegde items bevatten afbreekmetadata zodat transcriptconsumenten afgebroken gedeeltelijke tekst kunnen onderscheiden van normale voltooiingsuitvoer.

  </Accordion>
</AccordionGroup>

## PWA-installatie en webpush

De Control UI levert een `manifest.webmanifest` en een serviceworker, zodat moderne browsers deze als zelfstandige PWA kunnen installeren. Web Push laat de Gateway de geïnstalleerde PWA wekken met notificaties, zelfs wanneer het tabblad of browservenster niet open is.

Als de pagina **Protocol mismatch** toont direct na een OpenClaw-update, open dan eerst het dashboard opnieuw met `openclaw dashboard` en ververs de pagina hard. Als het nog steeds faalt, wis sitegegevens voor de dashboard-origin of test in een privébrowservenster; een oud tabblad of browser-serviceworkercache kan een Control UI-bundel van vóór de update blijven draaien tegen de nieuwere Gateway.

| Oppervlak                                            | Wat het doet                                                         |
| ---------------------------------------------------- | -------------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                     | PWA-manifest. Browsers bieden "App installeren" zodra het bereikbaar is. |
| `ui/public/sw.js`                                    | Service worker die `push`-gebeurtenissen en meldingsklikken afhandelt. |
| `push/vapid-keys.json` (onder de OpenClaw-statusmap) | Automatisch gegenereerd VAPID-sleutelpaar dat wordt gebruikt om Web Push-payloads te ondertekenen. |
| `push/web-push-subscriptions.json`                   | Opgeslagen browserabonnementseindpunten.                             |

Overschrijf het VAPID-sleutelpaar via omgevingsvariabelen op het Gateway-proces wanneer je sleutels wilt vastzetten (voor multi-host-implementaties, geheimrotatie of tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (standaard ingesteld op `https://openclaw.ai`)

De Control UI gebruikt deze scope-afgeschermde Gateway-methoden om browserabonnementen te registreren en te testen:

- `push.web.vapidPublicKey` — haalt de actieve openbare VAPID-sleutel op.
- `push.web.subscribe` — registreert een `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — verwijdert een geregistreerd eindpunt.
- `push.web.test` — stuurt een testmelding naar het abonnement van de aanroeper.

<Note>
Web Push staat los van het iOS APNS-relaypad (zie [Configuratie](/nl/gateway/configuration) voor relay-ondersteunde push) en de bestaande methode `push.test`, die gericht zijn op native mobiele koppeling.
</Note>

## Gehoste embeds

Assistentberichten kunnen gehoste webinhoud inline weergeven met de shortcode `[embed ...]`. Het sandboxbeleid voor iframes wordt beheerd door `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Schakelt scriptuitvoering binnen gehoste embeds uit.
  </Tab>
  <Tab title="scripts (default)">
    Staat interactieve embeds toe terwijl origin-isolatie behouden blijft; dit is de standaardinstelling en is meestal voldoende voor zelfstandige browsergames/widgets.
  </Tab>
  <Tab title="trusted">
    Voegt `allow-same-origin` toe bovenop `allow-scripts` voor documenten op dezelfde site die bewust sterkere privileges nodig hebben.
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

Gegroepeerde chatberichten gebruiken een leesbare standaard maximale breedte. Implementaties met brede monitoren kunnen dit overschrijven zonder gebundelde CSS te patchen door `gateway.controlUi.chatMessageMaxWidth` in te stellen:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

De waarde wordt gevalideerd voordat deze de browser bereikt. Ondersteunde waarden zijn onder andere gewone lengtes en percentages zoals `960px` of `82%`, plus beperkte breedte-expressies met `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` en `fit-content(...)`.

## Tailnet-toegang (aanbevolen)

<Tabs>
  <Tab title="Geïntegreerde Tailscale Serve (voorkeur)">
    Houd de Gateway op loopback en laat Tailscale Serve deze via HTTPS proxyen:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Open:

    - `https://<magicdns>/` (of je geconfigureerde `gateway.controlUi.basePath`)

    Standaard kunnen Control UI-/WebSocket-Serve-verzoeken zich authenticeren via Tailscale-identiteitsheaders (`tailscale-user-login`) wanneer `gateway.auth.allowTailscale` `true` is. OpenClaw verifieert de identiteit door het adres `x-forwarded-for` op te lossen met `tailscale whois` en dit te vergelijken met de header, en accepteert deze alleen wanneer het verzoek loopback raakt met Tailscale's `x-forwarded-*`-headers. Voor Control UI-operatorsessies met browserapparaatidentiteit slaat dit geverifieerde Serve-pad ook de retourtrip voor apparaatkoppeling over; browsers zonder apparaat en verbindingen met node-rol volgen nog steeds de normale apparaatcontroles. Stel `gateway.auth.allowTailscale: false` in als je expliciete gedeelde-geheimreferenties wilt vereisen, zelfs voor Serve-verkeer. Gebruik daarna `gateway.auth.mode: "token"` of `"password"`.

    Voor dat asynchrone Serve-identiteitspad worden mislukte authenticatiepogingen voor hetzelfde client-IP en dezelfde authenticatiescope geserialiseerd voordat rate-limit-schrijfbewerkingen plaatsvinden. Gelijktijdige mislukte nieuwe pogingen vanuit dezelfde browser kunnen daarom `retry later` tonen bij het tweede verzoek in plaats van twee gewone mismatches die parallel racen.

    <Warning>
    Tokenloze Serve-authenticatie gaat ervan uit dat de gatewayhost vertrouwd is. Vereis token-/wachtwoordauthenticatie als niet-vertrouwde lokale code op die host kan draaien.
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

Als je het dashboard opent via gewone HTTP (`http://<lan-ip>` of `http://<tailscale-ip>`), draait de browser in een **niet-beveiligde context** en blokkeert WebCrypto. Standaard **blokkeert** OpenClaw Control UI-verbindingen zonder apparaatidentiteit.

Gedocumenteerde uitzonderingen:

- alleen-localhost compatibiliteit met onveilige HTTP met `gateway.controlUi.allowInsecureAuth=true`
- geslaagde operator-Control UI-authenticatie via `gateway.auth.mode: "trusted-proxy"`
- noodoptie `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Aanbevolen oplossing:** gebruik HTTPS (Tailscale Serve) of open de UI lokaal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (op de gatewayhost)

<AccordionGroup>
  <Accordion title="Gedrag van onveilige-authenticatie-schakelaar">
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

    - Hiermee kunnen localhost-Control UI-sessies doorgaan zonder apparaatidentiteit in niet-beveiligde HTTP-contexten.
    - Het omzeilt koppelingscontroles niet.
    - Het versoepelt de vereisten voor apparaatidentiteit op afstand (niet-localhost) niet.

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
    `dangerouslyDisableDeviceAuth` schakelt apparaatidentiteitscontroles van de Control UI uit en is een ernstige beveiligingsverlaging. Draai dit snel terug na noodgebruik.
    </Warning>

  </Accordion>
  <Accordion title="Opmerking over trusted-proxy">
    - Geslaagde trusted-proxy-authenticatie kan **operator**-Control UI-sessies toelaten zonder apparaatidentiteit.
    - Dit geldt **niet** voor Control UI-sessies met node-rol.
    - Same-host loopback reverse proxies voldoen nog steeds niet aan trusted-proxy-authenticatie; zie [Trusted proxy-authenticatie](/nl/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Zie [Tailscale](/nl/gateway/tailscale) voor richtlijnen voor HTTPS-configuratie.

## Contentbeveiligingsbeleid

De Control UI wordt geleverd met een strikt `img-src`-beleid: alleen assets van **dezelfde origin**, `data:`-URL's en lokaal gegenereerde `blob:`-URL's zijn toegestaan. Externe `http(s)`- en protocol-relatieve afbeeldings-URL's worden door de browser geweigerd en leiden niet tot netwerkfetches.

Wat dit in de praktijk betekent:

- Avatars en afbeeldingen die onder relatieve paden worden aangeboden (bijvoorbeeld `/avatars/<id>`) worden nog steeds weergegeven, inclusief geauthenticeerde avatarroutes die de UI ophaalt en omzet in lokale `blob:`-URL's.
- Inline `data:image/...`-URL's worden nog steeds weergegeven (nuttig voor in-protocol-payloads).
- Lokale `blob:`-URL's die door de Control UI worden gemaakt, worden nog steeds weergegeven.
- Externe avatar-URL's die door kanaalmetadata worden uitgegeven, worden gestript door de avatarhelpers van de Control UI en vervangen door het ingebouwde logo/de ingebouwde badge, zodat een gecompromitteerd of kwaadaardig kanaal geen willekeurige externe afbeeldingsfetches vanuit een operatorbrowser kan afdwingen.

Je hoeft niets te wijzigen om dit gedrag te krijgen — het staat altijd aan en is niet configureerbaar.

## Avatarroute-authenticatie

Wanneer gatewayauthenticatie is geconfigureerd, vereist het avatar-eindpunt van de Control UI hetzelfde gatewaytoken als de rest van de API:

- `GET /avatar/<agentId>` retourneert de avatarafbeelding alleen aan geauthenticeerde aanroepers. `GET /avatar/<agentId>?meta=1` retourneert de avatarmetadata onder dezelfde regel.
- Niet-geauthenticeerde verzoeken naar beide routes worden geweigerd (overeenkomstig de naastliggende assistant-media-route). Dit voorkomt dat de avatarroute agentidentiteit lekt op hosts die verder beschermd zijn.
- De Control UI zelf stuurt het gatewaytoken door als bearer-header bij het ophalen van avatars en gebruikt geauthenticeerde blob-URL's zodat de afbeelding nog steeds in dashboards wordt weergegeven.

Als je gatewayauthenticatie uitschakelt (niet aanbevolen op gedeelde hosts), wordt de avatarroute ook niet-geauthenticeerd, in lijn met de rest van de gateway.

## Assistant-media-route-authenticatie

Wanneer gatewayauthenticatie is geconfigureerd, gebruiken lokale-media-previews van de assistant een route in twee stappen:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` vereist de normale operatorauthenticatie van de Control UI. De browser verzendt het gatewaytoken als bearer-header bij het controleren van beschikbaarheid.
- Geslaagde metadataresponsen bevatten een kortlevend `mediaTicket` dat is beperkt tot dat exacte bronpad.
- Door de browser weergegeven afbeeldings-, audio-, video- en document-URL's gebruiken `mediaTicket=<ticket>` in plaats van het actieve gatewaytoken of wachtwoord. Het ticket verloopt snel en kan geen andere bron autoriseren.

Dit houdt normale mediaweergave compatibel met browser-native media-elementen zonder herbruikbare gatewayreferenties in zichtbare media-URL's te plaatsen.

## De UI bouwen

De Gateway serveert statische bestanden uit `dist/control-ui`. Bouw ze met:

```bash
pnpm ui:build
```

Optionele absolute basis (wanneer je vaste asset-URL's wilt):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Voor lokale ontwikkeling (afzonderlijke dev-server):

```bash
pnpm ui:dev
```

Wijs de UI daarna naar je Gateway-WS-URL (bijv. `ws://127.0.0.1:18789`).

## Lege Control UI-pagina

Als de browser een leeg dashboard laadt en DevTools geen nuttige fout toont, kan een extensie of vroeg contentscript hebben verhinderd dat de JavaScript-module-app werd geëvalueerd. De statische pagina bevat een eenvoudig HTML-herstelpaneel dat verschijnt wanneer `<openclaw-app>` na het opstarten niet is geregistreerd.

Gebruik de actie **Opnieuw proberen** van het paneel nadat je de browseromgeving hebt gewijzigd, of laad handmatig opnieuw na deze controles:

- Schakel extensies uit die in alle pagina's injecteren, vooral extensies met `<all_urls>`-contentscripts.
- Probeer een privévenster, een schoon browserprofiel of een andere browser.
- Laat de Gateway draaien en verifieer dezelfde dashboard-URL na de browserwijziging.

## Foutopsporing/testen: dev-server + externe Gateway

De Control UI bestaat uit statische bestanden; het WebSocket-doel is configureerbaar en kan verschillen van de HTTP-origin. Dit is handig wanneer je de Vite-dev-server lokaal wilt gebruiken maar de Gateway elders draait.

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

    Optionele eenmalige authenticatie (indien nodig):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notities">
    - `gatewayUrl` wordt na het laden opgeslagen in localStorage en uit de URL verwijderd.
    - Als je een volledig `ws://`- of `wss://`-endpoint via `gatewayUrl` doorgeeft, URL-encodeer dan de waarde van `gatewayUrl` zodat de browser de querystring correct parseert.
    - `token` moet waar mogelijk via het URL-fragment (`#token=...`) worden doorgegeven. Fragmenten worden niet naar de server verzonden, waardoor lekkage via requestlogs en Referer wordt voorkomen. Verouderde queryparams met `?token=` worden voor compatibiliteit nog eenmalig geïmporteerd, maar alleen als fallback, en worden direct na de bootstrap verwijderd.
    - `password` wordt alleen in het geheugen bewaard.
    - Wanneer `gatewayUrl` is ingesteld, valt de UI niet terug op configuratie- of omgevingsreferenties. Geef `token` (of `password`) expliciet op. Ontbrekende expliciete referenties zijn een fout.
    - Gebruik `wss://` wanneer de Gateway achter TLS staat (Tailscale Serve, HTTPS-proxy, enz.).
    - `gatewayUrl` wordt alleen geaccepteerd in een venster op topniveau (niet ingesloten) om clickjacking te voorkomen.
    - Publieke niet-loopback Control UI-implementaties moeten `gateway.controlUi.allowedOrigins` expliciet instellen (volledige origins). Privé same-origin LAN/Tailnet-ladingen vanaf loopback-, RFC1918/link-local-, `.local`-, `.ts.net`- of Tailscale CGNAT-hosts worden geaccepteerd zonder Host-header fallback in te schakelen.
    - Het opstarten van de Gateway kan lokale origins zoals `http://localhost:<port>` en `http://127.0.0.1:<port>` seeden vanuit de effectieve runtime-bind en -poort, maar origins van externe browsers hebben nog steeds expliciete vermeldingen nodig.
    - Gebruik `gateway.controlUi.allowedOrigins: ["*"]` niet, behalve voor strikt gecontroleerde lokale tests. Het betekent dat elke browser-origin wordt toegestaan, niet "match de host die ik gebruik."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` schakelt de Host-header origin fallback-modus in, maar dit is een gevaarlijke beveiligingsmodus.

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

Details voor het instellen van externe toegang: [Externe toegang](/nl/gateway/remote).

## Gerelateerd

- [Dashboard](/nl/web/dashboard) — Gateway-dashboard
- [Gezondheidscontroles](/nl/gateway/health) — gezondheidsbewaking van de Gateway
- [TUI](/nl/web/tui) — terminalgebruikersinterface
- [WebChat](/nl/web/webchat) — browsergebaseerde chatinterface
