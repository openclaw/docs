---
read_when:
    - Je wilt de Gateway vanuit een browser bedienen
    - Je wilt Tailnet-toegang zonder SSH-tunnels
sidebarTitle: Control UI
summary: Browsergebaseerde bedienings-UI voor de Gateway (chat, activiteit, nodes, configuratie)
title: Controle-UI
x-i18n:
    generated_at: "2026-07-02T01:05:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 643249e6857cc1a32302f5139fcf89d46e01127f741f31efd36db4a6c60ef7b7
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
Bij native Windows-LAN-bindings kan Windows Firewall of door de organisatie beheerd Groepsbeleid de geadverteerde LAN-URL nog steeds blokkeren, zelfs wanneer `127.0.0.1` werkt op de Gateway-host. Voer `openclaw gateway status --deep` uit op de Windows-host; dit rapporteert waarschijnlijk geblokkeerde poorten, profielverschillen en lokale firewallregels die beleid mogelijk negeert.
</Note>

Auth wordt tijdens de WebSocket-handshake geleverd via:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve-identiteitsheaders wanneer `gateway.auth.allowTailscale: true`
- trusted-proxy-identiteitsheaders wanneer `gateway.auth.mode: "trusted-proxy"`

Het instellingenpaneel van het dashboard bewaart een token voor de huidige browsertabsessie en de geselecteerde gateway-URL; wachtwoorden worden niet opgeslagen. Onboarding genereert meestal een gateway-token voor shared-secret-auth bij de eerste verbinding, maar wachtwoordauth werkt ook wanneer `gateway.auth.mode` `"password"` is.

## Apparaat koppelen (eerste verbinding)

Wanneer je vanuit een nieuwe browser of vanaf een nieuw apparaat verbinding maakt met de Control UI, vereist de Gateway meestal een **eenmalige koppelingsgoedkeuring**. Dit is een beveiligingsmaatregel om onbevoegde toegang te voorkomen.

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

Als de browser opnieuw probeert te koppelen met gewijzigde auth-gegevens (rol/scopes/openbare sleutel), wordt de vorige openstaande aanvraag vervangen en wordt er een nieuwe `requestId` aangemaakt. Voer vóór goedkeuring opnieuw `openclaw devices list` uit.

Als de browser al gekoppeld is en je deze wijzigt van leestoegang naar schrijf-/beheertoegang, wordt dit behandeld als een goedkeuringsupgrade, niet als een stille herverbinding. OpenClaw houdt de oude goedkeuring actief, blokkeert de bredere herverbinding en vraagt je om de nieuwe scopeset expliciet goed te keuren.

Na goedkeuring wordt het apparaat onthouden en is hernieuwde goedkeuring niet nodig, tenzij je het intrekt met `openclaw devices revoke --device <id> --role <role>`. Zie [Apparaten-CLI](/nl/cli/devices) voor tokenrotatie en intrekking.

Paperclip-agents die verbinding maken via de `openclaw_gateway`-adapter gebruiken dezelfde goedkeuringsflow bij de eerste run. Voer na de eerste verbindingspoging `openclaw devices approve --latest` uit om de openstaande aanvraag te bekijken, en voer daarna opnieuw de afgedrukte opdracht `openclaw devices approve <requestId>` uit om deze goed te keuren. Geef expliciete `--url`- en `--token`-waarden door voor een externe gateway. Configureer een persistente `adapterConfig.devicePrivateKeyPem` in Paperclip in plaats van bij elke run een nieuwe kortstondige apparaatidentiteit te laten genereren, zodat goedkeuringen stabiel blijven na herstarts.

<Note>
- Rechtstreekse local loopback-browserverbindingen (`127.0.0.1` / `localhost`) worden automatisch goedgekeurd.
- Tailscale Serve kan de koppelingsronde overslaan voor Control UI-operatorsessies wanneer `gateway.auth.allowTailscale: true`, de Tailscale-identiteit wordt geverifieerd en de browser zijn apparaatidentiteit presenteert.
- Rechtstreekse Tailnet-bindings, LAN-browserverbindingen en browserprofielen zonder apparaatidentiteit vereisen nog steeds expliciete goedkeuring.
- Elk browserprofiel genereert een unieke apparaat-ID, dus wisselen van browser of het wissen van browsergegevens vereist opnieuw koppelen.

</Note>

## Persoonlijke identiteit (browser-lokaal)

De Control UI ondersteunt een persoonlijke identiteit per browser (weergavenaam en avatar) die aan uitgaande berichten wordt gekoppeld voor attributie in gedeelde sessies. Deze bevindt zich in browseropslag, is beperkt tot het huidige browserprofiel en wordt niet gesynchroniseerd naar andere apparaten of server-side opgeslagen, behalve de normale transcript-auteurschapsmetadata op berichten die je daadwerkelijk verzendt. Sitegegevens wissen of van browser wisselen zet dit terug naar leeg.

Hetzelfde browser-lokale patroon geldt voor de override van de assistentavatar. Geüploade assistentavatars overlappen de door de gateway opgeloste identiteit alleen in de lokale browser en maken nooit een round-trip via `config.patch`. Het gedeelde configuratieveld `ui.assistant.avatar` blijft beschikbaar voor niet-UI-clients die het veld rechtstreeks schrijven (zoals gescripte gateways of aangepaste dashboards).

## Runtime-configuratie-eindpunt

De Control UI haalt zijn runtime-instellingen op uit `/control-ui-config.json`, relatief opgelost ten opzichte van het Control UI-basispad van de gateway (bijvoorbeeld `/__openclaw__/control-ui-config.json` wanneer de UI wordt geserveerd onder `/__openclaw__/`). Dat eindpunt wordt afgeschermd door dezelfde gateway-auth als de rest van het HTTP-oppervlak: niet-geauthenticeerde browsers kunnen het niet ophalen, en een geslaagde fetch vereist een al geldig gateway-token/wachtwoord, Tailscale Serve-identiteit of trusted-proxy-identiteit.

## Taalondersteuning

De Control UI kan zichzelf bij de eerste laadactie lokaliseren op basis van je browserlocale. Om dit later te overschrijven, open **Overzicht -> Gateway-toegang -> Taal**. De locale-kiezer staat in de Gateway-toegangskaart, niet onder Weergave.

- Ondersteunde locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Niet-Engelse vertalingen worden lazy-loaded in de browser.
- De geselecteerde locale wordt opgeslagen in browseropslag en opnieuw gebruikt bij toekomstige bezoeken.
- Ontbrekende vertaalsleutels vallen terug op Engels.

Docs-vertalingen worden gegenereerd voor dezelfde niet-Engelse localeset, maar de ingebouwde Mintlify-taalkiezer van de documentatiesite is beperkt tot de locale-codes die Mintlify accepteert. Thaise (`th`) en Perzische (`fa`) docs worden nog steeds gegenereerd in de publicatierepo; ze verschijnen mogelijk pas in die kiezer wanneer Mintlify die codes ondersteunt.

## Weergavethema's

Het Weergave-paneel behoudt de ingebouwde thema's Claw, Knot en Dash, plus één browser-lokaal tweakcn-importslot. Om een thema te importeren, open je [tweakcn-editor](https://tweakcn.com/editor/theme), kies of maak je een thema, klik je op **Delen** en plak je de gekopieerde themalink in Weergave. De importeerfunctie accepteert ook `https://tweakcn.com/r/themes/<id>`-register-URL's, editor-URL's zoals `https://tweakcn.com/editor/theme?theme=amethyst-haze`, relatieve `/themes/<id>`-paden, ruwe thema-ID's en standaardthemanamen zoals `amethyst-haze`.

Weergave bevat ook een browser-lokale instelling voor tekstgrootte. De instelling wordt opgeslagen met de rest van de Control UI-voorkeuren, is van toepassing op chattekst, composer-tekst, toolkaarten en chatzijbalken, en houdt tekstinvoer minimaal 16px zodat mobiele Safari niet automatisch inzoomt bij focus.

Geïmporteerde thema's worden alleen opgeslagen in het huidige browserprofiel. Ze worden niet naar gateway-configuratie geschreven en synchroniseren niet tussen apparaten. Het vervangen van het geïmporteerde thema werkt het ene lokale slot bij; het wissen ervan schakelt het actieve thema terug naar Claw als het geïmporteerde thema geselecteerd was.

## Wat het kan doen (vandaag)

<AccordionGroup>
  <Accordion title="Chat and Talk">
    - Chat met het model via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Vernieuwingen van de chatgeschiedenis vragen een begrensd recent venster op met tekstlimieten per bericht, zodat grote sessies de browser niet dwingen een volledige transcript-payload te renderen voordat de chat bruikbaar wordt.
    - Praat via realtime browsersessies. OpenAI gebruikt directe WebRTC, Google Live gebruikt een begrensd browser-token voor eenmalig gebruik via WebSocket, en backend-only realtime spraakplugins gebruiken de Gateway-relaytransportlaag. Door de client beheerde providersessies starten met `talk.client.create`; Gateway-relaysessies starten met `talk.session.create`. De relay houdt providerreferenties op de Gateway terwijl de browser microfoon-PCM streamt via `talk.session.appendAudio`, `openclaw_agent_consult`-providertoolcalls doorstuurt via `talk.client.toolCall` voor Gateway-beleid en het grotere geconfigureerde OpenClaw-model, en spraaksturing voor actieve runs routeert via `talk.client.steer` of `talk.session.steer`.
    - Stream toolcalls + live tooluitvoerkaarten in Chat (agent-events).
    - Activiteitstabblad met browser-lokale, redactie-eerst-samenvattingen van live toolactiviteit uit bestaande `session.tool` / tool-eventlevering.

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - Kanalen: ingebouwde plus gebundelde/externe plugin-kanaalstatus, QR-login en configuratie per kanaal (`channels.status`, `web.login.*`, `config.patch`).
    - Vernieuwingen van kanaalprobes houden de vorige snapshot zichtbaar terwijl trage providercontroles afronden, en gedeeltelijke snapshots worden gelabeld wanneer een probe of audit zijn UI-budget overschrijdt.
    - Instanties: aanwezigheidslijst + vernieuwen (`system-presence`).
    - Sessies: geeft standaard geconfigureerde-agent-sessies weer, valt terug vanaf verouderde sessiesleutels van niet-geconfigureerde agents, en past model-/thinking-/fast-/verbose-/trace-/reasoning-overrides per sessie toe (`sessions.list`, `sessions.patch`).
    - Dromen: Dreaming-status, in-/uitschakelknop en Dream Diary-lezer (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - Cron-taken: weergeven/toevoegen/bewerken/uitvoeren/inschakelen/uitschakelen + uitvoeringsgeschiedenis (`cron.*`).
    - Skills: status, inschakelen/uitschakelen, installeren, API-sleutelupdates (`skills.*`).
    - Nodes: lijst + caps (`node.list`).
    - Exec-goedkeuringen: gateway- of node-allowlists bewerken + vraagbeleid voor `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Config">
    - Bekijk/bewerk `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP heeft een eigen instellingenpagina voor geconfigureerde servers, inschakeling, OAuth-/filter-/parallel-samenvattingen, algemene operatoropdrachten en de scoped `mcp`-configuratie-editor.
    - Toepassen + herstarten met validatie (`config.apply`) en de laatst actieve sessie wekken.
    - Schrijfacties bevatten een base-hash-bewaking om overschrijven van gelijktijdige bewerkingen te voorkomen.
    - Schrijfacties (`config.set`/`config.apply`/`config.patch`) voeren vooraf actieve SecretRef-resolutie uit voor refs in de ingediende configuratie-payload; niet-opgeloste actieve ingediende refs worden vóór schrijven geweigerd.
    - Formulieropslagacties verwijderen verouderde geredigeerde placeholders die niet uit de opgeslagen configuratie kunnen worden hersteld, terwijl geredigeerde waarden die nog steeds aan opgeslagen secrets zijn gekoppeld behouden blijven.
    - Schema + formulierweergave (`config.schema` / `config.schema.lookup`, inclusief veld `title` / `description`, overeenkomende UI-hints, directe kindsamenvattingen, docs-metadata op geneste object-/wildcard-/array-/composition-nodes, plus plugin- en kanaalschema's wanneer beschikbaar); Raw JSON-editor is alleen beschikbaar wanneer de snapshot een veilige raw round-trip heeft.
    - Als een snapshot raw tekst niet veilig kan laten round-trippen, dwingt Control UI de formuliermodus af en schakelt Raw-modus uit voor die snapshot.
    - Raw JSON-editor "Terugzetten naar opgeslagen" behoudt de raw-auteursvorm (opmaak, opmerkingen, `$include`-indeling) in plaats van een afgeplatte snapshot opnieuw te renderen, zodat externe bewerkingen een reset overleven wanneer de snapshot veilig kan round-trippen.
    - Gestructureerde SecretRef-objectwaarden worden read-only weergegeven in formuliertekstinvoer om onbedoelde corruptie van object naar string te voorkomen.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debug: status-/health-/models-snapshots + eventlog + handmatige RPC-calls (`status`, `health`, `models.list`).
    - Het eventlog bevat Control UI-vernieuwings-/RPC-timings, trage chat-/config-renderingtimings en browserresponsiviteitsitems voor lange animatieframes of lange taken wanneer de browser die PerformanceObserver-entrytypen blootlegt.
    - Logs: live tail van gateway-bestandslogs met filter/export (`logs.tail`).
    - Update: voer een package-/git-update + herstart uit (`update.run`) met een herstartrapport, en poll daarna `update.status` na herverbinding om de draaiende gateway-versie te verifiëren.

  </Accordion>
  <Accordion title="Cron jobs panel notes">
    - Voor geïsoleerde taken is de standaardbezorging een aankondigingssamenvatting. Je kunt overschakelen naar geen als je alleen-interne runs wilt.
    - Kanaal-/doelvelden verschijnen wanneer aankondigen is geselecteerd.
    - Webhook-modus gebruikt `delivery.mode = "webhook"` met `delivery.to` ingesteld op een geldige HTTP(S)-webhook-URL.
    - Voor hoofdsessietaken zijn de bezorgmodi webhook en geen beschikbaar.
    - Geavanceerde bewerkingsknoppen omvatten verwijderen-na-run, agent-override wissen, cron exact/gespreid-opties, overrides voor agentmodel/denken en schakelaars voor best-effort-bezorging.
    - Formuliervalidatie gebeurt inline met fouten op veldniveau; ongeldige waarden schakelen de opslagknop uit totdat ze zijn opgelost.
    - Stel `cron.webhookToken` in om een speciale bearer-token te verzenden; als dit wordt weggelaten, wordt de webhook zonder auth-header verzonden.
    - Verouderde fallback: voer `openclaw doctor --fix` uit om opgeslagen legacy-taken met `notify: true` te migreren van `cron.webhook` naar expliciete webhook- of voltooiingsbezorging per taak.

  </Accordion>
</AccordionGroup>

## MCP-pagina

De speciale MCP-pagina is een operatorweergave voor door OpenClaw beheerde MCP-servers onder `mcp.servers`. Deze start zelf geen MCP-transports; gebruik de pagina om opgeslagen configuratie te inspecteren en bewerken, en gebruik daarna `openclaw mcp doctor --probe` wanneer je live serverbewijs nodig hebt.

Typische workflow:

1. Open **MCP** vanuit de zijbalk.
2. Controleer de overzichtskaarten voor aantallen totaal, ingeschakeld, OAuth en gefilterde servers.
3. Bekijk elke serverrij op transport, inschakeling, auth, filters, time-outs en commandotips.
4. Schakel inschakeling om wanneer een server geconfigureerd moet blijven maar buiten runtime-discovery moet blijven.
5. Bewerk de afgebakende `mcp`-configuratiesectie voor serverdefinities, headers, TLS/mTLS-paden, OAuth-metadata, toolfilters en Codex-projectiemetadata.
6. Gebruik **Opslaan** voor een configuratieschrijving, of **Opslaan en publiceren** wanneer de actieve Gateway de gewijzigde configuratie moet toepassen.
7. Voer `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` of `openclaw mcp reload` uit vanuit een terminal wanneer het bewerkte proces statische diagnostiek, live bewijs of verwijdering van gecachete runtime nodig heeft.

De pagina maskeert URL-achtige waarden die referenties kunnen bevatten voordat ze worden weergegeven, en zet servernamen tussen aanhalingstekens in commandofragmenten zodat gekopieerde commando's nog steeds werken met spaties of shell-metatekens. De volledige CLI- en configuratiereferentie staat in [MCP](/nl/cli/mcp).

## Tabblad Activiteit

Het tabblad Activiteit is een vluchtige, browserlokale observator voor live toolactiviteit. Het is afgeleid van dezelfde Gateway `session.tool` / tool-eventstream die Chat-toolkaarten aandrijft; het voegt geen andere Gateway-eventfamilie, endpoint, duurzame activiteitsopslag, metrics-feed of externe observatorstream toe.

Activiteitsitems bewaren alleen gesaneerde samenvattingen en gemaskeerde, ingekorte uitvoervoorbeelden. Waarden van toolargumenten worden niet opgeslagen in de Activiteit-state; de UI toont dat argumenten verborgen zijn en registreert alleen het aantal argumentvelden. De in-memory lijst volgt het huidige browsertabblad, blijft behouden bij navigatie binnen de Control UI en wordt gereset bij het herladen van de pagina, wisselen van sessie of **Wissen**.

## Chatgedrag

<AccordionGroup>
  <Accordion title="Send and history semantics">
    - `chat.send` is **niet-blokkerend**: het bevestigt direct met `{ runId, status: "started" }` en de respons streamt via `chat`-events. Vertrouwde Control UI-clients kunnen ook optionele ACK-timingmetadata ontvangen voor lokale diagnostiek.
    - Chatuploads accepteren afbeeldingen plus niet-videobestanden. Afbeeldingen behouden het native afbeeldingspad; andere bestanden worden opgeslagen als beheerde media en in de geschiedenis getoond als bijlagelinks.
    - Opnieuw verzenden met dezelfde `idempotencyKey` retourneert `{ status: "in_flight" }` tijdens uitvoering, en `{ status: "ok" }` na voltooiing.
    - `chat.history`-responses zijn qua grootte begrensd voor UI-veiligheid. Wanneer transcriptitems te groot zijn, kan Gateway lange tekstvelden inkorten, zware metadatablokken weglaten en te grote berichten vervangen door een placeholder (`[chat.history omitted: message too large]`).
    - Wanneer een zichtbaar assistentbericht in `chat.history` is ingekort, kan de zijlezer het volledige weergave-genormaliseerde transcriptitem op aanvraag ophalen via `chat.message.get` met `sessionKey`, actieve `agentId` wanneer nodig, en transcript-`messageId`. Als de Gateway nog steeds niet meer kan teruggeven, toont de lezer een expliciete niet-beschikbare status in plaats van stilzwijgend het ingekorte voorbeeld te herhalen.
    - Door de assistent/gegenereerde afbeeldingen worden bewaard als beheerde mediareferenties en teruggeleverd via geauthenticeerde Gateway-media-URL's, zodat herladen niet afhankelijk is van ruwe base64-afbeeldingspayloads die in de chatgeschiedenisrespons blijven staan.
    - Bij het renderen van `chat.history` verwijdert de Control UI inline directivetags die alleen voor weergave zijn uit zichtbare assistenttekst (bijvoorbeeld `[[reply_to_*]]` en `[[audio_as_voice]]`), platte-tekst tool-call XML-payloads (inclusief `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en ingekorte tool-call-blokken), en gelekte ASCII-/full-width modelbesturingstokens, en laat assistentitems weg waarvan de volledige zichtbare tekst alleen het exacte stille token `NO_REPLY` / `no_reply` of het heartbeat-bevestigingstoken `HEARTBEAT_OK` is.
    - Tijdens een actieve verzending en de laatste geschiedenisverversing houdt de chatweergave lokale optimistische gebruikers-/assistentberichten zichtbaar als `chat.history` kort een oudere snapshot teruggeeft; het canonieke transcript vervangt die lokale berichten zodra de Gateway-geschiedenis is bijgewerkt.
    - Live `chat`-events zijn bezorgstatus, terwijl `chat.history` opnieuw wordt opgebouwd uit het duurzame sessietranscript. Na tool-final-events herlaadt de Control UI de geschiedenis en voegt alleen een kleine optimistische staart samen; de transcriptgrens is gedocumenteerd in [WebChat](/nl/web/webchat).
    - `chat.inject` voegt een assistentnotitie toe aan het sessietranscript en broadcast een `chat`-event voor alleen-UI-updates (geen agentrun, geen kanaalbezorging).
    - De chatkop toont het agentfilter vóór de sessiekiezer, en de sessiekiezer is afgebakend door de geselecteerde agent. Wisselen van agent toont alleen sessies die aan die agent zijn gekoppeld en valt terug op de hoofdsessie van die agent wanneer deze nog geen opgeslagen dashboardsessies heeft.
    - Op desktopbreedtes blijven chatknoppen op één compacte rij en klappen ze in tijdens het omlaag scrollen door het transcript; omhoog scrollen, terugkeren naar de bovenkant of de onderkant bereiken herstelt de knoppen.
    - Opeenvolgende dubbele berichten met alleen tekst worden weergegeven als één bubbel met een aantalsbadge. Berichten met afbeeldingen, bijlagen, tooluitvoer of canvasvoorbeelden blijven niet-ingeklapt.
    - De model- en denkkiezers in de chatkop patchen de actieve sessie onmiddellijk via `sessions.patch`; het zijn persistente sessie-overrides, geen verzendopties voor slechts één beurt.
    - Als je een bericht verzendt terwijl een wijziging in de modelkiezer voor dezelfde sessie nog wordt opgeslagen, wacht de composer op die sessiepatch voordat `chat.send` wordt aangeroepen, zodat de verzending het geselecteerde model gebruikt.
    - Het typen van `/new` in de Control UI maakt dezelfde nieuwe dashboardsessie aan als Nieuwe Chat en schakelt ernaar over, behalve wanneer `session.dmScope: "main"` is geconfigureerd en de huidige bovenliggende sessie de hoofdsessie van de agent is; in dat geval wordt de hoofdsessie ter plekke gereset. Het typen van `/reset` behoudt de expliciete in-place reset van de Gateway voor de huidige sessie.
    - De chatmodelkiezer vraagt de geconfigureerde modelweergave van de Gateway op. Als `agents.defaults.models` aanwezig is, stuurt die allowlist de kiezer aan, inclusief `provider/*`-items die provider-afgebakende catalogi dynamisch houden. Anders toont de kiezer expliciete `models.providers.*.models`-items plus providers met bruikbare auth. De volledige catalogus blijft beschikbaar via de debug-`models.list` RPC met `view: "all"`.
    - Wanneer verse Gateway-sessiegebruiksrapporten huidige contexttokens bevatten, toont het chatcomposergebied een compacte indicator voor contextgebruik. Deze schakelt over naar waarschuwingsstijl bij hoge contextdruk en toont, op aanbevolen compaction-niveaus, een compacte knop die het normale sessiecompactionpad uitvoert. Verouderde tokensnapshots worden verborgen totdat de Gateway opnieuw vers gebruik rapporteert.

  </Accordion>
  <Accordion title="Talk mode (browser realtime)">
    Talk-modus gebruikt een geregistreerde realtime spraakprovider. Configureer OpenAI met `talk.realtime.provider: "openai"` plus een `openai` API-sleutel-authprofiel, `talk.realtime.providers.openai.apiKey` of `OPENAI_API_KEY`; OpenAI OAuth-profielen configureren geen Realtime-spraak. Configureer Google met `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey`. De browser ontvangt nooit een standaard provider-API-sleutel. OpenAI ontvangt een vluchtig Realtime-clientsecret voor WebRTC. Google Live ontvangt een eenmalig beperkt Live API-auth-token voor een browser-WebSocket-sessie, waarbij instructies en tooldeclaraties door de Gateway in het token zijn vastgelegd. Providers die alleen een backend realtime bridge aanbieden, lopen via het Gateway-relaytransport, zodat referenties en vendor-sockets server-side blijven terwijl browseraudio via geauthenticeerde Gateway-RPC's beweegt. De Realtime-sessieprompt wordt samengesteld door de Gateway; `talk.client.create` accepteert geen door de aanroeper opgegeven instructie-overrides.

    De Chat-composer bevat een knop voor Talk-opties naast de start-/stopknop voor Talk. De opties gelden voor de volgende Talk-sessie en kunnen provider, transport, model, stem, redeneerinspanning, VAD-drempel, stilteduur en prefixpadding overriden. Wanneer een optie leeg is, gebruikt de Gateway geconfigureerde standaarden waar beschikbaar of de providerstandaard. Gateway-relay selecteren dwingt het backend-relaypad af; WebRTC selecteren houdt de sessie client-owned en faalt in plaats van stilzwijgend terug te vallen op relay als de provider geen browsersessie kan maken.

    In de Chat-composer is de Talk-knop de golfknop naast de microfoondictatieknop. Wanneer Talk start, toont de statusrij van de composer `Connecting Talk...`, daarna `Talk live` terwijl audio verbonden is, of `Asking OpenClaw...` terwijl een realtime tool-call het geconfigureerde grotere model raadpleegt via `talk.client.toolCall`.

    Maintainer live smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifieert de OpenAI backend WebSocket bridge, OpenAI browser WebRTC SDP-uitwisseling, Google Live constrained-token browser WebSocket-setup en de Gateway-relay browseradapter met nep-microfoonmedia. Het commando print alleen providerstatus en logt geen geheimen.

  </Accordion>
  <Accordion title="Stop and abort">
    - Klik op **Stop** (roept `chat.abort` aan).
    - Terwijl een run actief is, worden normale vervolgberichten in de wachtrij geplaatst. Klik op **Steer** bij een bericht in de wachtrij om dat vervolgbericht in de lopende beurt te injecteren.
    - Typ `/stop` (of zelfstandige abortzinnen zoals `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) om out-of-band af te breken.
    - `chat.abort` ondersteunt `{ sessionKey }` (geen `runId`) om alle actieve runs voor die sessie af te breken.

  </Accordion>
  <Accordion title="Abort partial retention">
    - Wanneer een run wordt afgebroken, kan gedeeltelijke assistenttekst nog steeds in de UI worden getoond.
    - Gateway bewaart afgebroken gedeeltelijke assistenttekst in transcriptgeschiedenis wanneer gebufferde uitvoer bestaat.
    - Bewaarde items bevatten abortmetadata zodat transcriptconsumenten abortgedeelten kunnen onderscheiden van normale voltooiingsuitvoer.

  </Accordion>
</AccordionGroup>

## PWA-installatie en webpush

De Control UI levert een `manifest.webmanifest` en een service worker, zodat moderne browsers deze als zelfstandige PWA kunnen installeren. Web Push laat de Gateway de geïnstalleerde PWA wekken met meldingen, zelfs wanneer het tabblad of browservenster niet open is.

Als de pagina direct na een OpenClaw-update **Protocol mismatch** toont, open dan eerst het dashboard opnieuw met `openclaw dashboard` en voer een harde verversing van de pagina uit. Als het nog steeds faalt, wis dan sitegegevens voor de dashboard-origin of test in een privébrowservenster; een oud tabblad of browser-serviceworkercache kan een Control UI-bundel van vóór de update blijven draaien tegen de nieuwere Gateway.

| Oppervlak                                            | Wat het doet                                                      |
| ---------------------------------------------------- | ----------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                     | PWA-manifest. Browsers bieden "App installeren" aan zodra het bereikbaar is. |
| `ui/public/sw.js`                                    | Serviceworker die `push`-gebeurtenissen en klikken op meldingen afhandelt. |
| `push/vapid-keys.json` (onder de OpenClaw-statusmap) | Automatisch gegenereerd VAPID-sleutelpaar dat wordt gebruikt om Web Push-payloads te ondertekenen. |
| `push/web-push-subscriptions.json`                   | Permanent opgeslagen browserabonnementseindpunten.               |

Overschrijf het VAPID-sleutelpaar via env-vars op het Gateway-proces wanneer je sleutels wilt vastzetten (voor multi-host-implementaties, geheimrotatie of tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (standaard `https://openclaw.ai`)

De Control UI gebruikt deze scope-gated Gateway-methoden om browserabonnementen te registreren en te testen:

- `push.web.vapidPublicKey` — haalt de actieve openbare VAPID-sleutel op.
- `push.web.subscribe` — registreert een `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — verwijdert een geregistreerd eindpunt.
- `push.web.test` — stuurt een testmelding naar het abonnement van de aanroeper.

<Note>
Web Push staat los van het iOS APNS-relaypad (zie [Configuratie](/nl/gateway/configuration) voor relay-ondersteunde push) en de bestaande methode `push.test`, die gericht zijn op native mobiele koppeling.
</Note>

## Gehoste embeds

Assistentberichten kunnen gehoste webinhoud inline renderen met de shortcode `[embed ...]`. Het iframe-sandboxbeleid wordt beheerd door `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Schakelt scriptuitvoering binnen gehoste embeds uit.
  </Tab>
  <Tab title="scripts (standaard)">
    Staat interactieve embeds toe terwijl origin-isolatie behouden blijft; dit is de standaardinstelling en is meestal voldoende voor op zichzelf staande browserspellen/widgets.
  </Tab>
  <Tab title="trusted">
    Voegt `allow-same-origin` toe boven op `allow-scripts` voor documenten op dezelfde site die bewust sterkere bevoegdheden nodig hebben.
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
Gebruik `trusted` alleen wanneer het ingesloten document echt same-origin-gedrag nodig heeft. Voor de meeste door agents gegenereerde spellen en interactieve canvassen is `scripts` de veiligere keuze.
</Warning>

Absolute externe `http(s)`-embed-URL's blijven standaard geblokkeerd. Als je bewust wilt dat `[embed url="https://..."]` pagina's van derden laadt, stel dan `gateway.controlUi.allowExternalEmbedUrls: true` in.

## Breedte van chatberichten

Gegroepeerde chatberichten gebruiken een leesbare standaard maximale breedte. Implementaties op brede monitoren kunnen dit overschrijven zonder gebundelde CSS te patchen door `gateway.controlUi.chatMessageMaxWidth` in te stellen:

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
    Houd de Gateway op loopback en laat Tailscale Serve deze met HTTPS proxien:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Open:

    - `https://<magicdns>/` (of je geconfigureerde `gateway.controlUi.basePath`)

    Standaard kunnen Control UI/WebSocket Serve-verzoeken authenticeren via Tailscale-identiteitsheaders (`tailscale-user-login`) wanneer `gateway.auth.allowTailscale` `true` is. OpenClaw verifieert de identiteit door het adres `x-forwarded-for` met `tailscale whois` op te lossen en dit met de header te matchen, en accepteert deze alleen wanneer het verzoek loopback raakt met Tailscale's `x-forwarded-*`-headers. Voor Control UI-operatorsessies met browserapparaatidentiteit slaat dit geverifieerde Serve-pad ook de apparaatkoppelingsronde over; browsers zonder apparaat en verbindingen met node-rol volgen nog steeds de normale apparaatcontroles. Stel `gateway.auth.allowTailscale: false` in als je expliciete gedeelde-geheimreferenties wilt vereisen, zelfs voor Serve-verkeer. Gebruik daarna `gateway.auth.mode: "token"` of `"password"`.

    Voor dat asynchrone Serve-identiteitspad worden mislukte auth-pogingen voor hetzelfde client-IP en dezelfde auth-scope geserialiseerd voordat rate-limit-writes plaatsvinden. Gelijktijdige foutieve nieuwe pogingen vanuit dezelfde browser kunnen daarom bij het tweede verzoek `retry later` tonen in plaats van twee gewone mismatches die parallel racen.

    <Warning>
    Tokenloze Serve-auth gaat ervan uit dat de gatewayhost vertrouwd is. Als niet-vertrouwde lokale code op die host kan draaien, vereis dan token-/wachtwoordauth.
    </Warning>

  </Tab>
  <Tab title="Aan tailnet binden + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Open daarna:

    - `http://<tailscale-ip>:18789/` (of je geconfigureerde `gateway.controlUi.basePath`)

    Plak het overeenkomende gedeelde geheim in de UI-instellingen (verzonden als `connect.params.auth.token` of `connect.params.auth.password`).

  </Tab>
</Tabs>

## Onveilige HTTP

Als je het dashboard opent via gewone HTTP (`http://<lan-ip>` of `http://<tailscale-ip>`), draait de browser in een **niet-veilige context** en blokkeert WebCrypto. Standaard **blokkeert** OpenClaw Control UI-verbindingen zonder apparaatidentiteit.

Gedocumenteerde uitzonderingen:

- alleen-localhost onveilige HTTP-compatibiliteit met `gateway.controlUi.allowInsecureAuth=true`
- geslaagde operator-Control UI-auth via `gateway.auth.mode: "trusted-proxy"`
- noodoptie `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Aanbevolen oplossing:** gebruik HTTPS (Tailscale Serve) of open de UI lokaal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (op de gatewayhost)

<AccordionGroup>
  <Accordion title="Gedrag van onveilige-auth-schakelaar">
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

    - Hiermee kunnen localhost-Control UI-sessies doorgaan zonder apparaatidentiteit in niet-veilige HTTP-contexten.
    - Hiermee worden koppelingscontroles niet omzeild.
    - Hiermee worden apparaatidentiteitsvereisten voor externe (niet-localhost) verbindingen niet versoepeld.

  </Accordion>
  <Accordion title="Alleen voor noodgevallen">
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
  <Accordion title="Opmerking over vertrouwde proxy">
    - Geslaagde trusted-proxy-auth kan **operator**-Control UI-sessies zonder apparaatidentiteit toelaten.
    - Dit geldt **niet** voor Control UI-sessies met node-rol.
    - Same-host loopback reverse proxies voldoen nog steeds niet aan trusted-proxy-auth; zie [Trusted proxy-auth](/nl/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Zie [Tailscale](/nl/gateway/tailscale) voor richtlijnen voor HTTPS-installatie.

## Contentbeveiligingsbeleid

De Control UI wordt geleverd met een strikt `img-src`-beleid: alleen assets van **same-origin**, `data:`-URL's en lokaal gegenereerde `blob:`-URL's zijn toegestaan. Externe `http(s)`- en protocol-relatieve afbeeldings-URL's worden door de browser geweigerd en veroorzaken geen netwerkfetches.

Wat dit in de praktijk betekent:

- Avatars en afbeeldingen die via relatieve paden worden aangeboden (bijvoorbeeld `/avatars/<id>`) renderen nog steeds, inclusief geauthenticeerde avatarroutes die de UI ophaalt en omzet naar lokale `blob:`-URL's.
- Inline `data:image/...`-URL's renderen nog steeds (handig voor payloads binnen het protocol).
- Lokale `blob:`-URL's die door de Control UI zijn gemaakt, renderen nog steeds.
- Externe avatar-URL's die door channel-metadata worden uitgegeven, worden bij de avatarhelpers van de Control UI verwijderd en vervangen door het ingebouwde logo/de ingebouwde badge, zodat een gecompromitteerd of kwaadaardig channel geen willekeurige externe afbeeldingsfetches vanuit een operatorbrowser kan afdwingen.

Je hoeft niets te wijzigen om dit gedrag te krijgen — het staat altijd aan en is niet configureerbaar.

## Auth voor avatarroute

Wanneer gateway-auth is geconfigureerd, vereist het Control UI-avatar-eindpunt hetzelfde gatewaytoken als de rest van de API:

- `GET /avatar/<agentId>` retourneert de avatarafbeelding alleen aan geauthenticeerde aanroepers. `GET /avatar/<agentId>?meta=1` retourneert de avatarmetadata onder dezelfde regel.
- Niet-geauthenticeerde verzoeken naar beide routes worden geweigerd (overeenkomstig de verwante assistant-media-route). Dit voorkomt dat de avatarroute agentidentiteit lekt op hosts die verder beschermd zijn.
- De Control UI zelf stuurt het gatewaytoken door als bearer-header bij het ophalen van avatars, en gebruikt geauthenticeerde blob-URL's zodat de afbeelding nog steeds in dashboards rendert.

Als je gateway-auth uitschakelt (niet aanbevolen op gedeelde hosts), wordt ook de avatarroute niet-geauthenticeerd, in lijn met de rest van de gateway.

## Auth voor assistentmediaroute

Wanneer gateway-auth is geconfigureerd, gebruiken lokale-mediavoorbeelden van de assistent een tweestapsroute:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` vereist de normale Control UI-operatorauth. De browser stuurt het gatewaytoken als bearer-header bij het controleren van beschikbaarheid.
- Geslaagde metadataresponses bevatten een kortlevend `mediaTicket` dat is beperkt tot dat exacte bronpad.
- Door de browser gerenderde URL's voor afbeeldingen, audio, video en documenten gebruiken `mediaTicket=<ticket>` in plaats van het actieve gatewaytoken of wachtwoord. Het ticket verloopt snel en kan geen andere bron autoriseren.

Zo blijft normale mediarendering compatibel met browser-native media-elementen zonder herbruikbare gatewayreferenties in zichtbare media-URL's te plaatsen.

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

Wijs de UI daarna naar je Gateway WS-URL (bijv. `ws://127.0.0.1:18789`).

## Lege Control UI-pagina

Als de browser een leeg dashboard laadt en DevTools geen nuttige fout toont, heeft een extensie of vroeg contentscript mogelijk voorkomen dat de JavaScript-module-app wordt geëvalueerd. De statische pagina bevat een eenvoudig HTML-herstelpaneel dat verschijnt wanneer `<openclaw-app>` na het opstarten niet is geregistreerd.

Gebruik de actie **Opnieuw proberen** van het paneel nadat je de browseromgeving hebt gewijzigd, of herlaad handmatig na deze controles:

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
    - Als je een volledig `ws://`- of `wss://`-endpoint via `gatewayUrl` doorgeeft, URL-codeer dan de waarde van `gatewayUrl` zodat de browser de querystring correct parseert.
    - `token` moet waar mogelijk via het URL-fragment (`#token=...`) worden doorgegeven. Fragmenten worden niet naar de server verzonden, waardoor lekkage via requestlogs en de Referer wordt voorkomen. Verouderde `?token=`-queryparameters worden voor compatibiliteit nog één keer geïmporteerd, maar alleen als fallback, en worden direct na bootstrap verwijderd.
    - `password` wordt alleen in het geheugen bewaard.
    - Wanneer `gatewayUrl` is ingesteld, valt de UI niet terug op referenties uit configuratie of omgeving. Geef `token` (of `password`) expliciet op. Ontbrekende expliciete referenties zijn een fout.
    - Gebruik `wss://` wanneer de Gateway achter TLS staat (Tailscale Serve, HTTPS-proxy, enz.).
    - `gatewayUrl` wordt alleen geaccepteerd in een venster op topniveau (niet ingesloten) om clickjacking te voorkomen.
    - Openbare niet-loopback Control UI-deployments moeten `gateway.controlUi.allowedOrigins` expliciet instellen (volledige origins). Privé same-origin LAN/Tailnet-loads vanaf loopback-, RFC1918/link-local-, `.local`-, `.ts.net`- of Tailscale CGNAT-hosts worden geaccepteerd zonder Host-header-fallback in te schakelen.
    - Het opstarten van de Gateway kan lokale origins zoals `http://localhost:<port>` en `http://127.0.0.1:<port>` vullen op basis van de effectieve runtime-bind en -poort, maar externe browser-origins hebben nog steeds expliciete vermeldingen nodig.
    - Gebruik `gateway.controlUi.allowedOrigins: ["*"]` niet, behalve voor strikt gecontroleerde lokale tests. Het betekent elke browser-origin toestaan, niet "overeenkomen met welke host ik ook gebruik."
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

Details voor het instellen van externe toegang: [Externe toegang](/nl/gateway/remote).

## Gerelateerd

- [Dashboard](/nl/web/dashboard) — gatewaydashboard
- [Health Checks](/nl/gateway/health) — gatewaygezondheidsbewaking
- [TUI](/nl/web/tui) — terminalgebruikersinterface
- [WebChat](/nl/web/webchat) — browsergebaseerde chatinterface
