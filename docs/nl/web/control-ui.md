---
read_when:
    - Je wilt de Gateway vanuit een browser bedienen
    - Je wilt Tailnet-toegang zonder SSH-tunnels
sidebarTitle: Control UI
summary: Browsergebaseerde bedienings-UI voor de Gateway (chat, knooppunten, configuratie)
title: Bedieningsinterface
x-i18n:
    generated_at: "2026-05-11T20:56:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0033b2666fe76bd23d5585d05b39fdd33f8d15d4e7c16561b5cfd0e75b8d22e
    source_path: web/control-ui.md
    workflow: 16
---

De Control UI is een kleine **Vite + Lit** single-page app die door de Gateway wordt aangeboden:

- standaard: `http://<host>:18789/`
- optioneel voorvoegsel: stel `gateway.controlUi.basePath` in (bijv. `/openclaw`)

Deze communiceert **rechtstreeks met de Gateway WebSocket** op dezelfde poort.

## Snel openen (lokaal)

Als de Gateway op dezelfde computer draait, open dan:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (of [http://localhost:18789/](http://localhost:18789/))

Als de pagina niet laadt, start dan eerst de Gateway: `openclaw gateway`.

Authenticatie wordt tijdens de WebSocket-handshake geleverd via:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve-identiteitsheaders wanneer `gateway.auth.allowTailscale: true`
- trusted-proxy-identiteitsheaders wanneer `gateway.auth.mode: "trusted-proxy"`

Het instellingenpaneel van het dashboard bewaart een token voor de huidige browsertabsessie en de geselecteerde Gateway-URL; wachtwoorden worden niet bewaard. Onboarding genereert meestal een Gateway-token voor shared-secret-authenticatie bij de eerste verbinding, maar wachtwoordauthenticatie werkt ook wanneer `gateway.auth.mode` `"password"` is.

## Apparaatkoppeling (eerste verbinding)

Wanneer je vanaf een nieuwe browser of nieuw apparaat verbinding maakt met de Control UI, vereist de Gateway meestal een **eenmalige koppelingsgoedkeuring**. Dit is een beveiligingsmaatregel om ongeautoriseerde toegang te voorkomen.

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

Als de browser opnieuw probeert te koppelen met gewijzigde authenticatiegegevens (rol/scopes/openbare sleutel), wordt de vorige openstaande aanvraag vervangen en wordt een nieuwe `requestId` aangemaakt. Voer `openclaw devices list` opnieuw uit vóór goedkeuring.

Als de browser al is gekoppeld en je deze wijzigt van leestoegang naar schrijf-/beheertoegang, wordt dit behandeld als een goedkeuringsupgrade, niet als een stille herverbinding. OpenClaw houdt de oude goedkeuring actief, blokkeert de bredere herverbinding en vraagt je de nieuwe set scopes expliciet goed te keuren.

Na goedkeuring wordt het apparaat onthouden en is opnieuw goedkeuren niet nodig, tenzij je het intrekt met `openclaw devices revoke --device <id> --role <role>`. Zie [Apparaten-CLI](/nl/cli/devices) voor tokenrotatie en intrekking.

<Note>
- Directe local loopback-browserverbindingen (`127.0.0.1` / `localhost`) worden automatisch goedgekeurd.
- Tailscale Serve kan de koppelingsronde overslaan voor Control UI-operatorsessies wanneer `gateway.auth.allowTailscale: true`, Tailscale-identiteit wordt geverifieerd en de browser zijn apparaatidentiteit presenteert.
- Directe Tailnet-binds, LAN-browserverbindingen en browserprofielen zonder apparaatidentiteit vereisen nog steeds expliciete goedkeuring.
- Elk browserprofiel genereert een unieke apparaat-ID, dus wisselen van browser of het wissen van browsergegevens vereist opnieuw koppelen.

</Note>

## Persoonlijke identiteit (browserlokaal)

De Control UI ondersteunt een persoonlijke identiteit per browser (weergavenaam en avatar) die aan uitgaande berichten wordt gekoppeld voor toeschrijving in gedeelde sessies. Deze bevindt zich in browseropslag, is gekoppeld aan het huidige browserprofiel en wordt niet gesynchroniseerd naar andere apparaten of server-side bewaard buiten de normale transcript-auteurschapsmetadata op berichten die je daadwerkelijk verzendt. Het wissen van sitegegevens of wisselen van browser zet deze terug naar leeg.

Hetzelfde browserlokale patroon geldt voor de override van de assistentavatar. Geüploade assistentavatars leggen de door de Gateway bepaalde identiteit alleen over de lokale browser heen en gaan nooit heen en terug via `config.patch`. Het gedeelde configuratieveld `ui.assistant.avatar` blijft beschikbaar voor niet-UI-clients die het veld rechtstreeks schrijven (zoals gescripte gateways of aangepaste dashboards).

## Runtime-configuratie-eindpunt

De Control UI haalt zijn runtime-instellingen op uit `/__openclaw/control-ui-config.json`. Dat eindpunt wordt beveiligd door dezelfde Gateway-authenticatie als de rest van het HTTP-oppervlak: niet-geauthenticeerde browsers kunnen het niet ophalen, en een succesvolle fetch vereist een al geldig Gateway-token/wachtwoord, Tailscale Serve-identiteit of een trusted-proxy-identiteit.

## Taalondersteuning

De Control UI kan zichzelf bij de eerste keer laden lokaliseren op basis van je browserlocale. Om dit later te overschrijven, open je **Overview -> Gateway Access -> Language**. De locale-kiezer bevindt zich in de Gateway Access-kaart, niet onder Appearance.

- Ondersteunde locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Niet-Engelse vertalingen worden lazy-loaded in de browser.
- De geselecteerde locale wordt opgeslagen in browseropslag en hergebruikt bij toekomstige bezoeken.
- Ontbrekende vertaalsleutels vallen terug op Engels.

Documentatievertalingen worden gegenereerd voor dezelfde niet-Engelse localeset, maar de ingebouwde Mintlify-taalkiezer van de documentatiesite is beperkt tot de localecodes die Mintlify accepteert. Thaise (`th`) en Perzische (`fa`) documentatie wordt nog steeds gegenereerd in de publicatierepository; deze verschijnt mogelijk pas in die kiezer wanneer Mintlify die codes ondersteunt.

## Weergavethema's

Het Appearance-paneel behoudt de ingebouwde Claw-, Knot- en Dash-thema's, plus één browserlokale tweakcn-importsleuf. Om een thema te importeren, open je [tweakcn editor](https://tweakcn.com/editor/theme), kies of maak je een thema, klik je op **Share** en plak je de gekopieerde themalink in Appearance. De importeur accepteert ook `https://tweakcn.com/r/themes/<id>`-register-URL's, editor-URL's zoals `https://tweakcn.com/editor/theme?theme=amethyst-haze`, relatieve `/themes/<id>`-paden, ruwe thema-ID's en standaardthemanamen zoals `amethyst-haze`.

Geïmporteerde thema's worden alleen in het huidige browserprofiel opgeslagen. Ze worden niet naar de Gateway-configuratie geschreven en synchroniseren niet tussen apparaten. Het vervangen van het geïmporteerde thema werkt de ene lokale sleuf bij; het wissen ervan schakelt het actieve thema terug naar Claw als het geïmporteerde thema geselecteerd was.

## Wat het kan doen (vandaag)

<AccordionGroup>
  <Accordion title="Chat en Talk">
    - Chat met het model via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Chatgeschiedenisverversingen vragen een begrensd recent venster op met tekstlimieten per bericht, zodat grote sessies de browser niet dwingen een volledige transcriptpayload te renderen voordat de chat bruikbaar wordt.
    - Praat via realtime browsersessies. OpenAI gebruikt directe WebRTC, Google Live gebruikt een beperkte browser-token voor eenmalig gebruik via WebSocket, en backend-only realtime spraakplugins gebruiken het Gateway-relaytransport. Door de client beheerde providersessies starten met `talk.client.create`; Gateway-relaysessies starten met `talk.session.create`. De relay houdt providerreferenties op de Gateway terwijl de browser microfoon-PCM streamt via `talk.session.appendAudio` en `openclaw_agent_consult`-providertoolcalls doorstuurt via `talk.client.toolCall` voor Gateway-beleid en het grotere geconfigureerde OpenClaw-model.
    - Stream toolcalls + live tooluitvoerkaarten in Chat (agentevents).

  </Accordion>
  <Accordion title="Kanalen, instanties, sessies, dromen">
    - Kanalen: ingebouwde plus gebundelde/externe pluginkanalenstatus, QR-login en configuratie per kanaal (`channels.status`, `web.login.*`, `config.patch`).
    - Kanaalprobe-verversingen houden de vorige snapshot zichtbaar terwijl trage providercontroles worden voltooid, en gedeeltelijke snapshots worden gelabeld wanneer een probe of audit het UI-budget overschrijdt.
    - Instanties: aanwezigheidslijst + verversen (`system-presence`).
    - Sessies: geef standaard sessies van geconfigureerde agenten weer, val terug van verouderde sessiesleutels van niet-geconfigureerde agenten en pas model-/thinking-/fast-/verbose-/trace-/reasoning-overrides per sessie toe (`sessions.list`, `sessions.patch`).
    - Dromen: Dreaming-status, aan/uit-schakelaar en Dream Diary-lezer (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, Nodes, exec-goedkeuringen">
    - Cron-taken: weergeven/toevoegen/bewerken/uitvoeren/inschakelen/uitschakelen + uitvoeringsgeschiedenis (`cron.*`).
    - Skills: status, inschakelen/uitschakelen, installeren, API-sleutelupdates (`skills.*`).
    - Nodes: lijst + mogelijkheden (`node.list`).
    - Exec-goedkeuringen: Gateway- of Node-allowlists bewerken + vraagbeleid voor `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuratie">
    - Bekijk/bewerk `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Pas toe + herstart met validatie (`config.apply`) en wek de laatst actieve sessie.
    - Schrijfacties bevatten een base-hash-guard om te voorkomen dat gelijktijdige bewerkingen worden overschreven.
    - Schrijfacties (`config.set`/`config.apply`/`config.patch`) voeren vooraf actieve SecretRef-resolutie uit voor refs in de ingediende configuratiepayload; niet-opgeloste actieve ingediende refs worden vóór het schrijven geweigerd.
    - Schema + formulierweergave (`config.schema` / `config.schema.lookup`, inclusief veld `title` / `description`, gematchte UI-hints, samenvattingen van directe kinderen, documentatiemetadata op geneste object-/wildcard-/array-/compositienodes, plus plugin- en kanaalschema's wanneer beschikbaar); Raw JSON-editor is alleen beschikbaar wanneer de snapshot een veilige raw-roundtrip heeft.
    - Als een snapshot ruwe tekst niet veilig heen en terug kan verwerken, dwingt Control UI de Form-modus af en schakelt Raw-modus uit voor die snapshot.
    - Raw JSON-editor "Reset to saved" behoudt de ruwe, door de auteur gemaakte vorm (opmaak, opmerkingen, `$include`-indeling) in plaats van een afgevlakte snapshot opnieuw te renderen, zodat externe bewerkingen een reset overleven wanneer de snapshot veilig heen en terug kan.
    - Gestructureerde SecretRef-objectwaarden worden alleen-lezen weergegeven in formuliertekstvelden om onbedoelde object-naar-string-corruptie te voorkomen.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debug: status-/health-/models-snapshots + eventlog + handmatige RPC-calls (`status`, `health`, `models.list`).
    - Het eventlog bevat Control UI-verversings-/RPC-timings, trage chat-/config-renderingstijden en vermeldingen over browserresponsiviteit voor lange animatieframes of lange taken wanneer de browser die PerformanceObserver-entrytypen beschikbaar stelt.
    - Logs: live tail van Gateway-bestandslogs met filter/export (`logs.tail`).
    - Update: voer een package-/git-update + herstart uit (`update.run`) met een herstartrapport en poll vervolgens `update.status` na herverbinding om de draaiende Gateway-versie te verifiëren.

  </Accordion>
  <Accordion title="Notities bij het Cron-takenpaneel">
    - Voor geïsoleerde taken is de standaardlevering een aankondigingssamenvatting. Je kunt overschakelen naar geen als je alleen interne runs wilt.
    - Kanaal-/doelvelden verschijnen wanneer aankondigen is geselecteerd.
    - Webhook-modus gebruikt `delivery.mode = "webhook"` met `delivery.to` ingesteld op een geldige HTTP(S)-Webhook-URL.
    - Voor hoofdsessietaken zijn Webhook- en geen-leveringsmodi beschikbaar.
    - Geavanceerde bewerkingsopties omvatten verwijderen-na-run, agentoverride wissen, Cron exact/stagger-opties, agentmodel-/thinking-overrides en best-effort-leveringsschakelaars.
    - Formuliervalidatie is inline met fouten op veldniveau; ongeldige waarden schakelen de knop Opslaan uit totdat ze zijn opgelost.
    - Stel `cron.webhookToken` in om een dedicated bearer-token te verzenden; indien weggelaten wordt de Webhook zonder authenticatieheader verzonden.
    - Verouderde fallback: opgeslagen legacytaken met `notify: true` kunnen nog steeds `cron.webhook` gebruiken totdat ze zijn gemigreerd.

  </Accordion>
</AccordionGroup>

## Chatgedrag

<AccordionGroup>
  <Accordion title="Verzend- en geschiedenissemantiek">
    - `chat.send` is **niet-blokkerend**: het bevestigt direct met `{ runId, status: "started" }` en de respons streamt via `chat`-gebeurtenissen.
    - Chat-uploads accepteren afbeeldingen plus niet-videobestanden. Afbeeldingen behouden het native afbeeldingspad; andere bestanden worden opgeslagen als beheerde media en in de geschiedenis getoond als bijlagelinks.
    - Opnieuw verzenden met dezelfde `idempotencyKey` retourneert `{ status: "in_flight" }` terwijl de uitvoering loopt, en `{ status: "ok" }` na voltooiing.
    - `chat.history`-responsen zijn in grootte begrensd voor UI-veiligheid. Wanneer transcriptitems te groot zijn, kan de Gateway lange tekstvelden inkorten, zware metadatablokken weglaten en te grote berichten vervangen door een placeholder (`[chat.history omitted: message too large]`).
    - Door de assistant/gegenereerde afbeeldingen worden opgeslagen als beheerde mediareferenties en teruggeleverd via geauthenticeerde Gateway-media-URL's, zodat herladen niet afhankelijk is van onbewerkte base64-afbeeldingspayloads die in de chatgeschiedenisrespons blijven staan.
    - Bij het renderen van `chat.history` verwijdert de Control-UI alleen-voor-weergave bedoelde inline directivetags uit zichtbare assistant-tekst (bijvoorbeeld `[[reply_to_*]]` en `[[audio_as_voice]]`), platte-tekst tool-call-XML-payloads (inclusief `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, en ingekorte tool-call-blokken), en gelekte ASCII-/volledige-breedte modelbesturingstokens, en laat assistant-items weg waarvan de volledige zichtbare tekst alleen het exacte stille token `NO_REPLY` / `no_reply` of het Heartbeat-bevestigingstoken `HEARTBEAT_OK` is.
    - Tijdens een actieve verzending en de uiteindelijke geschiedenisverversing houdt de chatweergave lokale optimistische gebruikers-/assistant-berichten zichtbaar als `chat.history` kort een oudere snapshot retourneert; het canonieke transcript vervangt die lokale berichten zodra de Gateway-geschiedenis is bijgewerkt.
    - Live `chat`-gebeurtenissen zijn afleverstatus, terwijl `chat.history` opnieuw wordt opgebouwd uit het duurzame sessietranscript. Na tool-final-gebeurtenissen laadt de Control-UI de geschiedenis opnieuw en voegt alleen een kleine optimistische staart samen; de transcriptgrens is gedocumenteerd in [WebChat](/nl/web/webchat).
    - `chat.inject` voegt een assistant-notitie toe aan het sessietranscript en zendt een `chat`-gebeurtenis uit voor alleen-UI-updates (geen agentuitvoering, geen kanaalaflevering).
    - De chatkop toont het agentfilter vóór de sessiekiezer, en de sessiekiezer is beperkt tot de geselecteerde agent. Wisselen van agent toont alleen sessies die aan die agent zijn gekoppeld en valt terug op de hoofdsessie van die agent wanneer die nog geen opgeslagen dashboardsessies heeft.
    - Op desktopbreedtes blijven chatbedieningen op één compacte rij staan en klappen ze in tijdens omlaag scrollen door het transcript; omhoog scrollen, terugkeren naar boven of de onderkant bereiken herstelt de bedieningen.
    - Opeenvolgende dubbele berichten met alleen tekst worden weergegeven als één ballon met een tellerbadge. Berichten die afbeeldingen, bijlagen, tooluitvoer of canvasvoorbeelden bevatten, blijven ongecomprimeerd.
    - De chatkop-model- en redeneerkiezers patchen de actieve sessie direct via `sessions.patch`; het zijn persistente sessie-overschrijvingen, geen verzendopties voor slechts één beurt.
    - Als je een bericht verzendt terwijl een wijziging in de modelkiezer voor dezelfde sessie nog wordt opgeslagen, wacht de composer op die sessiepatch voordat `chat.send` wordt aangeroepen, zodat de verzending het geselecteerde model gebruikt.
    - Het typen van `/new` in de Control-UI maakt dezelfde nieuwe dashboardsessie aan als Nieuwe Chat en schakelt ernaar over, behalve wanneer `session.dmScope: "main"` is geconfigureerd en de huidige ouder de hoofdsessie van de agent is; in dat geval wordt de hoofdsessie ter plekke gereset. Het typen van `/reset` behoudt de expliciete in-place reset van de Gateway voor de huidige sessie.
    - De chatmodelkiezer vraagt de geconfigureerde modelweergave van de Gateway op. Als `agents.defaults.models` aanwezig is, stuurt die allowlist de kiezer aan, inclusief `provider/*`-items die provider-gescopeerde catalogi dynamisch houden. Anders toont de kiezer expliciete `models.providers.*.models`-items plus providers met bruikbare authenticatie. De volledige catalogus blijft beschikbaar via de debug-`models.list`-RPC met `view: "all"`.
    - Wanneer verse Gateway-sessiegebruiksrapporten huidige contexttokens bevatten, toont het chatcomposergebied een compacte indicator voor contextgebruik. Die schakelt bij hoge contextdruk over naar waarschuwingsstijl en toont, op aanbevolen Compaction-niveaus, een compacte knop die het normale sessie-Compaction-pad uitvoert. Verouderde tokensnapshots worden verborgen totdat de Gateway opnieuw vers gebruik rapporteert.

  </Accordion>
  <Accordion title="Praatmodus (browserrealtime)">
    De praatmodus gebruikt een geregistreerde realtime spraakprovider. Configureer OpenAI met `talk.realtime.provider: "openai"` plus `talk.realtime.providers.openai.apiKey`, `OPENAI_API_KEY`, of een `openai-codex` OAuth-profiel; configureer Google met `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey`. De browser ontvangt nooit een standaard provider-API-sleutel. OpenAI ontvangt een vluchtig Realtime-clientgeheim voor WebRTC. Google Live ontvangt een eenmalig beperkt Live API-authenticatietoken voor een browser-WebSocket-sessie, waarbij instructies en tooldeclaraties door de Gateway in het token zijn vergrendeld. Providers die alleen een backend-realtimebrug aanbieden, lopen via het Gateway-relaytransport, zodat referenties en leverancierssockets server-side blijven terwijl browseraudio via geauthenticeerde Gateway-RPC's loopt. De Realtime-sessieprompt wordt door de Gateway samengesteld; `talk.client.create` accepteert geen door de aanroeper aangeleverde instructie-overschrijvingen.

    De Chat-composer bevat een praatoptiesknop naast de start-/stopknop voor praten. De opties gelden voor de volgende praatsessie en kunnen provider, transport, model, stem, redeneerinspanning, VAD-drempel, stilteperiode en prefixopvulling overschrijven. Wanneer een optie leeg is, gebruikt de Gateway waar beschikbaar geconfigureerde standaardwaarden of de providerstandaard. Gateway-relay selecteren forceert het backend-relaypad; WebRTC selecteren houdt de sessie client-eigendom en faalt in plaats van stil terug te vallen op relay als de provider geen browsersessie kan maken.

    In de Chat-composer is de praatbediening de golvenknop naast de microfoondictatieknop. Wanneer praten start, toont de composerstatusrij `Connecting Talk...`, daarna `Talk live` terwijl audio verbonden is, of `Asking OpenClaw...` terwijl een realtime tool-call het geconfigureerde grotere model raadpleegt via `talk.client.toolCall`.

    Maintainer live smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifieert de OpenAI backend-WebSocket-brug, OpenAI browser-WebRTC SDP-uitwisseling, Google Live beperkt-token browser-WebSocket-installatie en de Gateway-relaybrowseradapter met nep-microfoonmedia. De opdracht print alleen providerstatus en logt geen geheimen.

  </Accordion>
  <Accordion title="Stoppen en afbreken">
    - Klik op **Stoppen** (roept `chat.abort` aan).
    - Terwijl een uitvoering actief is, worden normale vervolgberichten in de wachtrij geplaatst. Klik op **Sturen** bij een bericht in de wachtrij om dat vervolgbericht in de lopende beurt te injecteren.
    - Typ `/stop` (of zelfstandige afbreekzinnen zoals `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) om buiten de normale band af te breken.
    - `chat.abort` ondersteunt `{ sessionKey }` (geen `runId`) om alle actieve uitvoeringen voor die sessie af te breken.

  </Accordion>
  <Accordion title="Behoud van afgebroken gedeeltelijke uitvoer">
    - Wanneer een uitvoering wordt afgebroken, kan gedeeltelijke assistant-tekst nog steeds in de UI worden getoond.
    - De Gateway bewaart afgebroken gedeeltelijke assistant-tekst in de transcriptgeschiedenis wanneer gebufferde uitvoer bestaat.
    - Bewaarde items bevatten afbreekmetadata, zodat transcriptconsumenten afgebroken gedeeltelijke uitvoer kunnen onderscheiden van normale voltooiingsuitvoer.

  </Accordion>
</AccordionGroup>

## PWA-installatie en webpush

De Control-UI levert een `manifest.webmanifest` en een serviceworker, zodat moderne browsers deze als zelfstandige PWA kunnen installeren. Webpush laat de Gateway de geïnstalleerde PWA met meldingen wekken, zelfs wanneer het tabblad of browservenster niet open is.

| Oppervlak                                             | Wat het doet                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA-manifest. Browsers bieden "App installeren" aan zodra het bereikbaar is. |
| `ui/public/sw.js`                                     | Serviceworker die `push`-gebeurtenissen en meldingsklikken afhandelt. |
| `push/vapid-keys.json` (onder de OpenClaw-statusmap)  | Automatisch gegenereerd VAPID-sleutelpaar dat wordt gebruikt om webpushpayloads te ondertekenen. |
| `push/web-push-subscriptions.json`                    | Bewaarde browserabonnement-eindpunten.                             |

Overschrijf het VAPID-sleutelpaar via omgevingsvariabelen op het Gateway-proces wanneer je sleutels wilt vastzetten (voor multi-host-deployments, geheimrotatie of tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (standaard `mailto:openclaw@localhost`)

De Control-UI gebruikt deze scope-begrensde Gateway-methoden om browserabonnementen te registreren en te testen:

- `push.web.vapidPublicKey` — haalt de actieve openbare VAPID-sleutel op.
- `push.web.subscribe` — registreert een `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — verwijdert een geregistreerd eindpunt.
- `push.web.test` — verzendt een testmelding naar het abonnement van de aanroeper.

<Note>
Webpush is onafhankelijk van het iOS APNS-relaypad (zie [Configuratie](/nl/gateway/configuration) voor relay-ondersteunde push) en de bestaande `push.test`-methode, die native mobiele koppeling targeten.
</Note>

## Gehoste embeds

Assistant-berichten kunnen gehoste webinhoud inline renderen met de `[embed ...]`-shortcode. Het iframe-sandboxbeleid wordt beheerd door `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Schakelt scriptuitvoering binnen gehoste embeds uit.
  </Tab>
  <Tab title="scripts (standaard)">
    Staat interactieve embeds toe terwijl oorsprongisolatie behouden blijft; dit is de standaard en is meestal genoeg voor zelfstandige browserspellen/widgets.
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
Gebruik `trusted` alleen wanneer het ingesloten document echt same-origin-gedrag nodig heeft. Voor de meeste door agents gegenereerde spellen en interactieve canvassen is `scripts` de veiligere keuze.
</Warning>

Absolute externe `http(s)`-embed-URL's blijven standaard geblokkeerd. Als je bewust wilt dat `[embed url="https://..."]` pagina's van derden laadt, stel dan `gateway.controlUi.allowExternalEmbedUrls: true` in.

## Breedte van chatberichten

Gegroepeerde chatberichten gebruiken een leesbare standaardmaximum-breedte. Wide-monitor-deployments kunnen deze overschrijven zonder gebundelde CSS te patchen door `gateway.controlUi.chatMessageMaxWidth` in te stellen:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

De waarde wordt gevalideerd voordat deze de browser bereikt. Ondersteunde waarden omvatten eenvoudige lengtes en percentages zoals `960px` of `82%`, plus begrensde `min(...)`-, `max(...)`-, `clamp(...)`-, `calc(...)`- en `fit-content(...)`-breedte-expressies.

## Tailnet-toegang (aanbevolen)

<Tabs>
  <Tab title="Geïntegreerde Tailscale Serve (voorkeur)">
    Houd de Gateway op loopback en laat Tailscale Serve deze proxien met HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Open:

    - `https://<magicdns>/` (of je geconfigureerde `gateway.controlUi.basePath`)

    Standaard kunnen Control UI/WebSocket Serve-verzoeken authenticeren via Tailscale-identiteitsheaders (`tailscale-user-login`) wanneer `gateway.auth.allowTailscale` `true` is. OpenClaw verifieert de identiteit door het `x-forwarded-for`-adres op te lossen met `tailscale whois` en dit te vergelijken met de header, en accepteert deze alleen wanneer het verzoek loopback bereikt met Tailscale's `x-forwarded-*`-headers. Voor Control UI-operatorsessies met browserapparaatidentiteit slaat dit geverifieerde Serve-pad ook de device-pairing round trip over; browsers zonder apparaat en verbindingen met node-rol blijven de normale apparaatcontroles volgen. Stel `gateway.auth.allowTailscale: false` in als je expliciete gedeelde-geheimreferenties wilt vereisen, zelfs voor Serve-verkeer. Gebruik daarna `gateway.auth.mode: "token"` of `"password"`.

    Voor dat asynchrone Serve-identiteitspad worden mislukte authenticatiepogingen voor hetzelfde client-IP en dezelfde authenticatiescope geserialiseerd voordat rate-limit-schrijfacties plaatsvinden. Gelijktijdige foutieve nieuwe pogingen vanuit dezelfde browser kunnen daarom bij het tweede verzoek `retry later` tonen in plaats van twee gewone mismatches die parallel racen.

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

Als je het dashboard opent via gewone HTTP (`http://<lan-ip>` of `http://<tailscale-ip>`), draait de browser in een **niet-veilige context** en blokkeert WebCrypto. Standaard **blokkeert** OpenClaw Control UI-verbindingen zonder apparaatidentiteit.

Gedocumenteerde uitzonderingen:

- alleen-localhost compatibiliteit voor onveilige HTTP met `gateway.controlUi.allowInsecureAuth=true`
- succesvolle operator-Control UI-authenticatie via `gateway.auth.mode: "trusted-proxy"`
- noodoptie `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Aanbevolen oplossing:** gebruik HTTPS (Tailscale Serve) of open de UI lokaal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (op de gatewayhost)

<AccordionGroup>
  <Accordion title="Gedrag van schakelaar voor onveilige authenticatie">
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
    - Het omzeilt geen koppelingscontroles.
    - Het versoepelt geen vereisten voor externe (niet-localhost) apparaatidentiteit.

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
    `dangerouslyDisableDeviceAuth` schakelt apparaatidentiteitscontroles van de Control UI uit en is een ernstige veiligheidsverlaging. Draai dit snel terug na noodgebruik.
    </Warning>

  </Accordion>
  <Accordion title="Opmerking over vertrouwde proxy">
    - Succesvolle trusted-proxy-authenticatie kan **operator**-Control UI-sessies zonder apparaatidentiteit toelaten.
    - Dit geldt **niet** voor Control UI-sessies met node-rol.
    - Same-host loopback-reverseproxy's voldoen nog steeds niet aan trusted-proxy-authenticatie; zie [Authenticatie met vertrouwde proxy](/nl/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Zie [Tailscale](/nl/gateway/tailscale) voor richtlijnen voor HTTPS-configuratie.

## Content security policy

De Control UI wordt geleverd met een strikte `img-src`-policy: alleen assets van **dezelfde oorsprong**, `data:`-URL's en lokaal gegenereerde `blob:`-URL's zijn toegestaan. Externe `http(s)`- en protocolrelatieve afbeeldings-URL's worden door de browser geweigerd en veroorzaken geen netwerkverzoeken.

Wat dit in de praktijk betekent:

- Avatars en afbeeldingen die via relatieve paden worden aangeboden (bijvoorbeeld `/avatars/<id>`) worden nog steeds weergegeven, inclusief geauthenticeerde avatarroutes die de UI ophaalt en omzet naar lokale `blob:`-URL's.
- Inline `data:image/...`-URL's worden nog steeds weergegeven (handig voor payloads binnen het protocol).
- Lokale `blob:`-URL's die door de Control UI zijn gemaakt, worden nog steeds weergegeven.
- Externe avatar-URL's die door kanaalmetadata worden uitgegeven, worden bij de avatarhelpers van de Control UI verwijderd en vervangen door het ingebouwde logo/de ingebouwde badge, zodat een gecompromitteerd of kwaadaardig kanaal geen willekeurige externe afbeeldingsverzoeken vanuit een operatorbrowser kan afdwingen.

Je hoeft niets te wijzigen om dit gedrag te krijgen — het staat altijd aan en is niet configureerbaar.

## Authenticatie voor avatarroute

Wanneer gatewayauthenticatie is geconfigureerd, vereist het avatarendpoint van de Control UI hetzelfde gatewaytoken als de rest van de API:

- `GET /avatar/<agentId>` retourneert de avatarafbeelding alleen aan geauthenticeerde callers. `GET /avatar/<agentId>?meta=1` retourneert de avatarmetadata onder dezelfde regel.
- Niet-geauthenticeerde verzoeken naar beide routes worden geweigerd (overeenkomstig de sibling assistant-media-route). Dit voorkomt dat de avatarroute agentidentiteit lekt op hosts die verder beschermd zijn.
- De Control UI zelf stuurt het gatewaytoken door als bearer-header bij het ophalen van avatars en gebruikt geauthenticeerde blob-URL's zodat de afbeelding nog steeds in dashboards wordt weergegeven.

Als je gatewayauthenticatie uitschakelt (niet aanbevolen op gedeelde hosts), wordt de avatarroute ook niet-geauthenticeerd, in lijn met de rest van de Gateway.

## Authenticatie voor assistant-mediaroute

Wanneer gatewayauthenticatie is geconfigureerd, gebruiken lokale mediavoorvertoningen van de assistant een route in twee stappen:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` vereist de normale Control UI-operatorauthenticatie. De browser verzendt het gatewaytoken als bearer-header bij het controleren van beschikbaarheid.
- Succesvolle metadatareacties bevatten een kortlevende `mediaTicket` die is beperkt tot dat exacte bronpad.
- Door de browser weergegeven afbeeldings-, audio-, video- en document-URL's gebruiken `mediaTicket=<ticket>` in plaats van het actieve gatewaytoken of wachtwoord. Het ticket verloopt snel en kan geen andere bron autoriseren.

Dit houdt normale mediaweergave compatibel met browser-native media-elementen zonder herbruikbare gatewayreferenties in zichtbare media-URL's te plaatsen.

## De UI bouwen

De Gateway serveert statische bestanden vanuit `dist/control-ui`. Bouw ze met:

```bash
pnpm ui:build
```

Optionele absolute basis (wanneer je vaste asset-URL's wilt):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Voor lokale ontwikkeling (aparte devserver):

```bash
pnpm ui:dev
```

Wijs de UI daarna naar je Gateway WS-URL (bijv. `ws://127.0.0.1:18789`).

## Lege Control UI-pagina

Als de browser een leeg dashboard laadt en DevTools geen bruikbare fout toont, kan een extensie of vroeg contentscript hebben voorkomen dat de JavaScript-module-app wordt geëvalueerd. De statische pagina bevat een gewoon HTML-herstelpaneel dat verschijnt wanneer `<openclaw-app>` na het opstarten niet is geregistreerd.

Gebruik de actie **Opnieuw proberen** van het paneel nadat je de browseromgeving hebt gewijzigd, of herlaad handmatig na deze controles:

- Schakel extensies uit die in alle pagina's injecteren, vooral extensies met `<all_urls>`-contentscripts.
- Probeer een privévenster, een schoon browserprofiel of een andere browser.
- Houd de Gateway actief en verifieer dezelfde dashboard-URL na de browserwijziging.

## Debuggen/testen: devserver + externe Gateway

De Control UI bestaat uit statische bestanden; het WebSocket-doel is configureerbaar en kan verschillen van de HTTP-oorsprong. Dit is handig wanneer je de Vite-devserver lokaal wilt gebruiken, maar de Gateway elders draait.

<Steps>
  <Step title="Start de UI-devserver">
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
    - Als je een volledig `ws://`- of `wss://`-endpoint via `gatewayUrl` doorgeeft, URL-encode dan de waarde van `gatewayUrl` zodat de browser de querystring correct parseert.
    - `token` moet waar mogelijk via het URL-fragment (`#token=...`) worden doorgegeven. Fragmenten worden niet naar de server verzonden, wat lekkage via requestlogs en Referer voorkomt. Verouderde queryparameters `?token=` worden nog eenmaal geïmporteerd voor compatibiliteit, maar alleen als fallback, en worden direct na bootstrap verwijderd.
    - `password` wordt alleen in het geheugen bewaard.
    - Wanneer `gatewayUrl` is ingesteld, valt de UI niet terug op configuratie- of omgevingsreferenties. Geef `token` (of `password`) expliciet op. Ontbrekende expliciete referenties is een fout.
    - Gebruik `wss://` wanneer de Gateway achter TLS staat (Tailscale Serve, HTTPS-proxy, enz.).
    - `gatewayUrl` wordt alleen geaccepteerd in een top-level venster (niet ingebed) om clickjacking te voorkomen.
    - Niet-loopback Control UI-deployments moeten `gateway.controlUi.allowedOrigins` expliciet instellen (volledige origins). Dit omvat externe devopstellingen.
    - Het opstarten van de Gateway kan lokale origins zoals `http://localhost:<port>` en `http://127.0.0.1:<port>` seeden op basis van de effectieve runtime-bind en poort, maar externe browser-origins hebben nog steeds expliciete vermeldingen nodig.
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

Details voor externe-toegangsconfiguratie: [Externe toegang](/nl/gateway/remote).

## Gerelateerd

- [Dashboard](/nl/web/dashboard) — gatewaydashboard
- [Health Checks](/nl/gateway/health) — gezondheidsbewaking van gateway
- [TUI](/nl/web/tui) — terminalgebruikersinterface
- [WebChat](/nl/web/webchat) — browsergebaseerde chatinterface
