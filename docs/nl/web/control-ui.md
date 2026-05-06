---
read_when:
    - Je wilt de Gateway vanuit een browser bedienen
    - Je wilt Tailnet-toegang zonder SSH-tunnels
sidebarTitle: Control UI
summary: Browsergebaseerde bedienings-UI voor de Gateway (chat, knooppunten, configuratie)
title: Bedieningsinterface
x-i18n:
    generated_at: "2026-05-06T09:38:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c16b37405d7a490b89ea90f2b006c01b9a7b1a3e5278769006b4dc94e7d83aa
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

Auth wordt tijdens de WebSocket-handshake geleverd via:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve-identiteitsheaders wanneer `gateway.auth.allowTailscale: true`
- vertrouwde-proxy-identiteitsheaders wanneer `gateway.auth.mode: "trusted-proxy"`

Het instellingenpaneel van het dashboard bewaart een token voor de huidige browsertabsessie en de geselecteerde gateway-URL; wachtwoorden worden niet bewaard. Onboarding genereert meestal een gateway-token voor gedeeld-geheim-auth bij de eerste verbinding, maar wachtwoord-auth werkt ook wanneer `gateway.auth.mode` `"password"` is.

## Apparaat koppelen (eerste verbinding)

Wanneer je vanaf een nieuwe browser of apparaat verbinding maakt met de Control UI, vereist de Gateway meestal een **eenmalige koppelingsgoedkeuring**. Dit is een beveiligingsmaatregel om onbevoegde toegang te voorkomen.

**Wat je ziet:** "disconnected (1008): pairing required"

<Steps>
  <Step title="Openstaande verzoeken weergeven">
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

Als de browser opnieuw probeert te koppelen met gewijzigde auth-details (rol/scopes/openbare sleutel), wordt het eerdere openstaande verzoek vervangen en wordt er een nieuwe `requestId` aangemaakt. Voer vóór goedkeuring opnieuw `openclaw devices list` uit.

Als de browser al gekoppeld is en je deze wijzigt van leestoegang naar schrijf-/admin-toegang, wordt dit behandeld als een goedkeuringsupgrade, niet als een stille herverbinding. OpenClaw houdt de oude goedkeuring actief, blokkeert de bredere herverbinding en vraagt je de nieuwe set scopes expliciet goed te keuren.

Na goedkeuring wordt het apparaat onthouden en is opnieuw goedkeuren niet nodig, tenzij je het intrekt met `openclaw devices revoke --device <id> --role <role>`. Zie [Apparaten-CLI](/nl/cli/devices) voor tokenrotatie en intrekking.

<Note>
- Rechtstreekse local loopback-browserverbindingen (`127.0.0.1` / `localhost`) worden automatisch goedgekeurd.
- Tailscale Serve kan de koppelingsronde overslaan voor Control UI-operatorsessies wanneer `gateway.auth.allowTailscale: true`, de Tailscale-identiteit wordt geverifieerd en de browser zijn apparaatidentiteit presenteert.
- Rechtstreekse Tailnet-binds, LAN-browserverbindingen en browserprofielen zonder apparaatidentiteit vereisen nog steeds expliciete goedkeuring.
- Elk browserprofiel genereert een unieke apparaat-ID, dus van browser wisselen of browsergegevens wissen vereist opnieuw koppelen.

</Note>

## Persoonlijke identiteit (browserlokaal)

De Control UI ondersteunt een persoonlijke identiteit per browser (weergavenaam en avatar) die aan uitgaande berichten wordt gekoppeld voor attributie in gedeelde sessies. Deze staat in browseropslag, is beperkt tot het huidige browserprofiel en wordt niet gesynchroniseerd naar andere apparaten of server-side bewaard buiten de normale transcript-auteurschapsmetadata op berichten die je daadwerkelijk verzendt. Sitegegevens wissen of van browser wisselen zet deze terug naar leeg.

Hetzelfde browserlokale patroon geldt voor de override van de assistentavatar. Geüploade assistentavatars leggen de gateway-opgeloste identiteit alleen over de lokale browser heen en gaan nooit heen en terug via `config.patch`. Het gedeelde configuratieveld `ui.assistant.avatar` blijft beschikbaar voor niet-UI-clients die het veld rechtstreeks schrijven (zoals gescripte gateways of aangepaste dashboards).

## Runtime-configuratie-endpoint

De Control UI haalt zijn runtime-instellingen op van `/__openclaw/control-ui-config.json`. Dat endpoint wordt beschermd door dezelfde gateway-auth als de rest van het HTTP-oppervlak: niet-geauthenticeerde browsers kunnen het niet ophalen, en een succesvolle fetch vereist een al geldig gateway-token/wachtwoord, Tailscale Serve-identiteit of een vertrouwde-proxy-identiteit.

## Taalondersteuning

De Control UI kan zichzelf bij de eerste laadactie lokaliseren op basis van je browserlocale. Om dit later te overschrijven, open je **Overzicht -> Gateway-toegang -> Taal**. De localekiezer staat in de kaart Gateway-toegang, niet onder Uiterlijk.

- Ondersteunde locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Niet-Engelse vertalingen worden lazy-loaded in de browser.
- De geselecteerde locale wordt opgeslagen in browseropslag en hergebruikt bij toekomstige bezoeken.
- Ontbrekende vertaalsleutels vallen terug op Engels.

Docs-vertalingen worden gegenereerd voor dezelfde niet-Engelse localeset, maar de ingebouwde Mintlify-taalkiezer van de docs-site is beperkt tot de localecodes die Mintlify accepteert. Thaise (`th`) en Perzische (`fa`) docs worden nog steeds gegenereerd in de publish-repo; ze verschijnen mogelijk pas in die kiezer wanneer Mintlify die codes ondersteunt.

## Uiterlijksthema's

Het paneel Uiterlijk behoudt de ingebouwde thema's Claw, Knot en Dash, plus één browserlokale tweakcn-importslot. Om een thema te importeren, open je [tweakcn editor](https://tweakcn.com/editor/theme), kies of maak je een thema, klik je op **Share** en plak je de gekopieerde themalink in Uiterlijk. De importeur accepteert ook `https://tweakcn.com/r/themes/<id>`-registry-URL's, editor-URL's zoals `https://tweakcn.com/editor/theme?theme=amethyst-haze`, relatieve `/themes/<id>`-paden, ruwe thema-ID's en standaardthemanamen zoals `amethyst-haze`.

Geïmporteerde thema's worden alleen in het huidige browserprofiel opgeslagen. Ze worden niet naar gateway-configuratie geschreven en synchroniseren niet tussen apparaten. Het geïmporteerde thema vervangen werkt het ene lokale slot bij; het wissen schakelt het actieve thema terug naar Claw als het geïmporteerde thema geselecteerd was.

## Wat het kan doen (vandaag)

<AccordionGroup>
  <Accordion title="Chat en Gesprek">
    - Chat met het model via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Vernieuwingen van de chatgeschiedenis vragen een begrensd recent venster op met tekstlimieten per bericht, zodat grote sessies de browser niet dwingen een volledige transcript-payload te renderen voordat de chat bruikbaar wordt.
    - Praat via realtime browsersessies. OpenAI gebruikt directe WebRTC, Google Live gebruikt een beperkt eenmalig browsertoken via WebSocket, en backend-only realtime spraak-plugins gebruiken de Gateway-relaytransportlaag. Door de client beheerde providersessies starten met `talk.client.create`; Gateway-relaysessies starten met `talk.session.create`. De relay houdt providerreferenties op de Gateway terwijl de browser microfoon-PCM streamt via `talk.session.appendAudio` en `openclaw_agent_consult`-provider-toolcalls doorstuurt via `talk.client.toolCall` voor Gateway-beleid en het grotere geconfigureerde OpenClaw-model.
    - Stream toolcalls + live tooluitvoerkaarten in Chat (agentgebeurtenissen).

  </Accordion>
  <Accordion title="Kanalen, instanties, sessies, dreams">
    - Kanalen: ingebouwde plus gebundelde/externe plugin-kanaalstatus, QR-login en configuratie per kanaal (`channels.status`, `web.login.*`, `config.patch`).
    - Verversen van kanaalprobes houdt de vorige momentopname zichtbaar terwijl trage providercontroles worden afgerond, en gedeeltelijke momentopnamen krijgen een label wanneer een probe of audit het UI-budget overschrijdt.
    - Instanties: aanwezigheidslijst + verversen (`system-presence`).
    - Sessies: lijst + model-/thinking-/fast-/verbose-/trace-/reasoning-overrides per sessie (`sessions.list`, `sessions.patch`).
    - Dreams: dreaming-status, aan/uit-schakelaar en Dream Diary-lezer (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, nodes, exec-goedkeuringen">
    - Cron-taken: weergeven/toevoegen/bewerken/uitvoeren/inschakelen/uitschakelen + uitvoeringsgeschiedenis (`cron.*`).
    - Skills: status, inschakelen/uitschakelen, installeren, API-sleutelupdates (`skills.*`).
    - Nodes: lijst + caps (`node.list`).
    - Exec-goedkeuringen: gateway- of node-allowlists bewerken + vraagbeleid voor `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuratie">
    - Bekijk/bewerk `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Toepassen + herstarten met validatie (`config.apply`) en de laatst actieve sessie wekken.
    - Schrijfacties bevatten een base-hash-bescherming om overschrijven van gelijktijdige bewerkingen te voorkomen.
    - Schrijfacties (`config.set`/`config.apply`/`config.patch`) voeren een preflight uit voor actieve SecretRef-resolutie voor refs in de ingediende configuratiepayload; onopgeloste actieve ingediende refs worden vóór het schrijven geweigerd.
    - Schema + formulierweergave (`config.schema` / `config.schema.lookup`, inclusief veld `title` / `description`, gematchte UI-hints, directe child-samenvattingen, docs-metadata op geneste object-/wildcard-/array-/composition-nodes, plus plugin- + kanaalschema's wanneer beschikbaar); Raw JSON-editor is alleen beschikbaar wanneer de momentopname een veilige raw round-trip heeft.
    - Als een momentopname raw tekst niet veilig heen en terug kan laten gaan, dwingt Control UI de Form-modus af en schakelt Raw-modus uit voor die momentopname.
    - Raw JSON-editor "Reset to saved" behoudt de raw-auteursvorm (opmaak, opmerkingen, `$include`-indeling) in plaats van een afgevlakte momentopname opnieuw te renderen, zodat externe bewerkingen een reset overleven wanneer de momentopname veilig heen en terug kan.
    - Gestructureerde SecretRef-objectwaarden worden alleen-lezen weergegeven in formuliertekstinvoeren om onbedoelde object-naar-string-corruptie te voorkomen.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debug: status-/health-/models-momentopnamen + gebeurtenissenlog + handmatige RPC-aanroepen (`status`, `health`, `models.list`).
    - Het gebeurtenissenlog bevat Control UI-verversings-/RPC-timings, timings voor trage chat-/config-rendering en browserresponsiviteitsitems voor lange animatieframes of lange taken wanneer de browser die PerformanceObserver-entrytypen beschikbaar stelt.
    - Logs: live tail van gateway-bestandslogs met filter/export (`logs.tail`).
    - Update: voer een package-/git-update + herstart uit (`update.run`) met een herstartrapport, en poll daarna `update.status` na herverbinding om de actieve gateway-versie te verifiëren.

  </Accordion>
  <Accordion title="Opmerkingen bij het Cron-takenpaneel">
    - Voor geïsoleerde taken is aankondigingssamenvatting de standaardlevering. Je kunt overschakelen naar geen als je alleen interne runs wilt.
    - Kanaal-/doelvelden verschijnen wanneer aankondigen is geselecteerd.
    - Webhook-modus gebruikt `delivery.mode = "webhook"` met `delivery.to` ingesteld op een geldige HTTP(S)-webhook-URL.
    - Voor hoofdsessietaken zijn webhook- en geen-leveringsmodi beschikbaar.
    - Geavanceerde bewerkingsopties omvatten verwijderen-na-uitvoeren, agent-override wissen, cron exact/stagger-opties, agentmodel-/thinking-overrides en best-effort-leveringsschakelaars.
    - Formuliervalidatie is inline met fouten op veldniveau; ongeldige waarden schakelen de opslagknop uit totdat ze zijn opgelost.
    - Stel `cron.webhookToken` in om een speciaal bearer-token te verzenden; indien weggelaten wordt de webhook zonder auth-header verzonden.
    - Verouderde fallback: opgeslagen legacy-taken met `notify: true` kunnen nog steeds `cron.webhook` gebruiken totdat ze zijn gemigreerd.

  </Accordion>
</AccordionGroup>

## Chatgedrag

<AccordionGroup>
  <Accordion title="Verzend- en geschiedenissemantiek">
    - `chat.send` is **niet-blokkerend**: het bevestigt direct met `{ runId, status: "started" }` en het antwoord streamt via `chat`-events.
    - Chat-uploads accepteren afbeeldingen plus niet-videobestanden. Afbeeldingen behouden het native afbeeldingspad; andere bestanden worden opgeslagen als beheerde media en in de geschiedenis weergegeven als bijlagelinks.
    - Opnieuw verzenden met dezelfde `idempotencyKey` retourneert `{ status: "in_flight" }` terwijl de uitvoering loopt, en `{ status: "ok" }` na voltooiing.
    - `chat.history`-antwoorden zijn in omvang begrensd voor UI-veiligheid. Wanneer transcriptitems te groot zijn, kan de Gateway lange tekstvelden inkorten, zware metadatablokken weglaten en te grote berichten vervangen door een placeholder (`[chat.history omitted: message too large]`).
    - Door de assistent gegenereerde afbeeldingen worden bewaard als beheerde mediareferenties en teruggegeven via geauthenticeerde Gateway-media-URL's, zodat herladen niet afhankelijk is van onbewerkte base64-afbeeldingspayloads die in het chatgeschiedenisantwoord blijven staan.
    - Bij het renderen van `chat.history` verwijdert de Control UI inline directivetags die alleen voor weergave zijn bedoeld uit zichtbare assistenttekst (bijvoorbeeld `[[reply_to_*]]` en `[[audio_as_voice]]`), XML-payloads voor tool-aanroepen in platte tekst (waaronder `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en ingekorte tool-aanroepblokken), en gelekte ASCII-/full-width modelbesturingstokens, en laat assistentitems weg waarvan de volledige zichtbare tekst alleen het exacte stille token `NO_REPLY` / `no_reply` of het Heartbeat-bevestigingstoken `HEARTBEAT_OK` is.
    - Tijdens een actieve verzending en de laatste geschiedenisverversing houdt de chatweergave lokale optimistische gebruikers-/assistentberichten zichtbaar als `chat.history` kort een oudere snapshot retourneert; het canonieke transcript vervangt die lokale berichten zodra de Gateway-geschiedenis is bijgewerkt.
    - Live `chat`-events zijn afleveringsstatus, terwijl `chat.history` opnieuw wordt opgebouwd uit het duurzame sessietranscript. Na tool-final-events laadt de Control UI de geschiedenis opnieuw en voegt alleen een kleine optimistische staart samen; de transcriptgrens is gedocumenteerd in [WebChat](/nl/web/webchat).
    - `chat.inject` voegt een assistentnotitie toe aan het sessietranscript en broadcast een `chat`-event voor UI-only updates (geen agentuitvoering, geen kanaalaflevering).
    - De chatkop toont het agentfilter vóór de sessiekiezer, en de sessiekiezer is beperkt tot de geselecteerde agent. Wisselen van agent toont alleen sessies die aan die agent zijn gekoppeld en valt terug op de hoofdsessie van die agent wanneer deze nog geen opgeslagen dashboardsessies heeft.
    - Op desktopbreedtes blijven chatbedieningselementen op één compacte rij staan en klappen ze in tijdens het omlaag scrollen door het transcript; omhoog scrollen, terugkeren naar de bovenkant of de onderkant bereiken herstelt de bedieningselementen.
    - Opeenvolgende dubbele tekst-only berichten worden weergegeven als één ballon met een aantalbadge. Berichten met afbeeldingen, bijlagen, tool-uitvoer of canvasvoorvertoningen blijven niet samengevouwen.
    - De model- en denk-kiezers in de chatkop patchen de actieve sessie direct via `sessions.patch`; het zijn permanente sessie-overschrijvingen, geen verzendopties voor slechts één beurt.
    - `/new` typen in de Control UI maakt dezelfde nieuwe dashboardsessie als Nieuwe chat aan en schakelt ernaar over. `/reset` typen behoudt de expliciete in-place reset van de Gateway voor de huidige sessie.
    - De chatmodelkiezer vraagt de geconfigureerde modelweergave van de Gateway op. Als `agents.defaults.models` aanwezig is, stuurt die allowlist de kiezer aan. Anders toont de kiezer expliciete `models.providers.*.models`-items plus providers met bruikbare authenticatie. De volledige catalogus blijft beschikbaar via de debug-`models.list`-RPC met `view: "all"`.
    - Wanneer verse Gateway-sessiegebruiksrapporten hoge contextdruk tonen, toont het chatcomposergebied een contextmelding en, op aanbevolen Compaction-niveaus, een compacte knop die het normale sessie-Compaction-pad uitvoert. Verouderde tokensnapshots worden verborgen totdat de Gateway opnieuw vers gebruik rapporteert.

  </Accordion>
  <Accordion title="Praatmodus (browser-realtime)">
    De praatmodus gebruikt een geregistreerde realtime spraakprovider. Configureer OpenAI met `talk.realtime.provider: "openai"` plus `talk.realtime.providers.openai.apiKey`, of configureer Google met `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey`. De browser ontvangt nooit een standaard provider-API-sleutel. OpenAI ontvangt een kortstondig Realtime-clientgeheim voor WebRTC. Google Live ontvangt een eenmalig beperkt Live API-authenticatietoken voor een browser-WebSocket-sessie, waarbij instructies en tooldeclaraties door de Gateway in het token zijn vastgezet. Providers die alleen een backend-realtimebrug aanbieden, lopen via het Gateway-relaytransport, zodat referenties en leverancierssockets server-side blijven terwijl browseraudio via geauthenticeerde Gateway-RPC's beweegt. De Realtime-sessieprompt wordt samengesteld door de Gateway; `talk.client.create` accepteert geen door de aanroeper aangeleverde instructie-overschrijvingen.

    In de chatcomposer is de Praat-bediening de golfknop naast de microfoondictatieknop. Wanneer Praat start, toont de composerstatusrij `Connecting Talk...`, daarna `Talk live` terwijl audio is verbonden, of `Asking OpenClaw...` terwijl een realtime tool-aanroep het geconfigureerde grotere model raadpleegt via `talk.client.toolCall`.

    Live-smoke voor maintainers: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifieert de OpenAI-browser-WebRTC-SDP-uitwisseling, de Google Live-browser-WebSocket-configuratie met beperkt token en de Gateway-relaybrowseradapter met nep-microfoonmedia. De opdracht print alleen providerstatus en logt geen geheimen.

  </Accordion>
  <Accordion title="Stoppen en afbreken">
    - Klik op **Stoppen** (roept `chat.abort` aan).
    - Terwijl een uitvoering actief is, worden normale vervolgberichten in de wachtrij geplaatst. Klik op **Sturen** bij een bericht in de wachtrij om dat vervolgbericht in de lopende beurt te injecteren.
    - Typ `/stop` (of losstaande afbreekzinnen zoals `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) om out-of-band af te breken.
    - `chat.abort` ondersteunt `{ sessionKey }` (geen `runId`) om alle actieve uitvoeringen voor die sessie af te breken.

  </Accordion>
  <Accordion title="Behoud van gedeeltelijke afbreekuitvoer">
    - Wanneer een uitvoering wordt afgebroken, kan gedeeltelijke assistenttekst nog steeds in de UI worden getoond.
    - Gateway bewaart afgebroken gedeeltelijke assistenttekst in de transcriptgeschiedenis wanneer gebufferde uitvoer bestaat.
    - Bewaarde items bevatten afbreekmetadata zodat transcriptconsumenten afgebroken gedeeltelijke uitvoer kunnen onderscheiden van normale voltooiingsuitvoer.

  </Accordion>
</AccordionGroup>

## PWA-installatie en webpush

De Control UI levert een `manifest.webmanifest` en een service worker, zodat moderne browsers deze als een zelfstandige PWA kunnen installeren. Webpush laat de Gateway de geïnstalleerde PWA wakker maken met meldingen, zelfs wanneer het tabblad of browservenster niet open is.

| Surface                                               | Wat het doet                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA-manifest. Browsers bieden "App installeren" aan zodra het bereikbaar is. |
| `ui/public/sw.js`                                     | Service worker die `push`-events en meldingsklikken afhandelt. |
| `push/vapid-keys.json` (onder de OpenClaw-statusmap) | Automatisch gegenereerd VAPID-sleutelpaar dat wordt gebruikt om webpushpayloads te ondertekenen. |
| `push/web-push-subscriptions.json`                    | Bewaarde browserabonnementseindpunten.                          |

Overschrijf het VAPID-sleutelpaar via env-vars op het Gateway-proces wanneer je sleutels wilt vastpinnen (voor multi-host deployments, geheimrotatie of tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (standaard `mailto:openclaw@localhost`)

De Control UI gebruikt deze door scope begrensde Gateway-methoden om browserabonnementen te registreren en te testen:

- `push.web.vapidPublicKey` — haalt de actieve openbare VAPID-sleutel op.
- `push.web.subscribe` — registreert een `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — verwijdert een geregistreerd endpoint.
- `push.web.test` — verstuurt een testmelding naar het abonnement van de aanroeper.

<Note>
Webpush staat los van het iOS-APNS-relaypad (zie [Configuratie](/nl/gateway/configuration) voor relay-ondersteunde push) en de bestaande methode `push.test`, die gericht zijn op native mobiele koppeling.
</Note>

## Gehoste embeds

Assistentberichten kunnen gehoste webcontent inline renderen met de shortcode `[embed ...]`. Het iframe-sandboxbeleid wordt beheerd door `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Schakelt scriptuitvoering binnen gehoste embeds uit.
  </Tab>
  <Tab title="scripts (standaard)">
    Staat interactieve embeds toe terwijl oorsprongsisolatie behouden blijft; dit is de standaard en is meestal genoeg voor zelfstandige browsergames/widgets.
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
Gebruik `trusted` alleen wanneer het ingesloten document echt same-origin-gedrag nodig heeft. Voor de meeste door agents gegenereerde games en interactieve canvassen is `scripts` de veiligere keuze.
</Warning>

Absolute externe `http(s)`-embed-URL's blijven standaard geblokkeerd. Als je bewust wilt dat `[embed url="https://..."]` pagina's van derden laadt, stel dan `gateway.controlUi.allowExternalEmbedUrls: true` in.

## Breedte van chatberichten

Gegroepeerde chatberichten gebruiken een leesbare standaard maximale breedte. Deployments met brede monitoren kunnen deze overschrijven zonder gebundelde CSS te patchen door `gateway.controlUi.chatMessageMaxWidth` in te stellen:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

De waarde wordt gevalideerd voordat deze de browser bereikt. Ondersteunde waarden omvatten gewone lengtes en percentages zoals `960px` of `82%`, plus begrensde `min(...)`-, `max(...)`-, `clamp(...)`-, `calc(...)`- en `fit-content(...)`-breedte-expressies.

## Tailnet-toegang (aanbevolen)

<Tabs>
  <Tab title="Geïntegreerde Tailscale Serve (voorkeur)">
    Houd de Gateway op loopback en laat Tailscale Serve deze proxien met HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Open:

    - `https://<magicdns>/` (of je geconfigureerde `gateway.controlUi.basePath`)

    Standaard kunnen Control UI-/WebSocket Serve-aanvragen authenticeren via Tailscale-identiteitsheaders (`tailscale-user-login`) wanneer `gateway.auth.allowTailscale` `true` is. OpenClaw verifieert de identiteit door het `x-forwarded-for`-adres op te lossen met `tailscale whois` en dit te matchen met de header, en accepteert deze alleen wanneer de aanvraag loopback bereikt met de `x-forwarded-*`-headers van Tailscale. Voor Control UI-operatorsessies met browserapparaatidentiteit slaat dit geverifieerde Serve-pad ook de apparaatkoppelingsronde over; apparaatloze browsers en node-role-verbindingen volgen nog steeds de normale apparaatcontroles. Stel `gateway.auth.allowTailscale: false` in als je expliciete shared-secret-referenties wilt vereisen, zelfs voor Serve-verkeer. Gebruik daarna `gateway.auth.mode: "token"` of `"password"`.

    Voor dat asynchrone Serve-identiteitspad worden mislukte authenticatiepogingen voor hetzelfde client-IP en dezelfde authenticatiescope geserialiseerd voordat rate-limit-schrijfacties plaatsvinden. Gelijktijdige slechte herhalingspogingen vanuit dezelfde browser kunnen daarom bij de tweede aanvraag `retry later` tonen in plaats van twee gewone mismatches die parallel racen.

    <Warning>
    Tokenloze Serve-authenticatie gaat ervan uit dat de gatewayhost vertrouwd is. Als onvertrouwde lokale code op die host kan draaien, vereis dan token-/wachtwoordauthenticatie.
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

Als u het dashboard opent via gewone HTTP (`http://<lan-ip>` of `http://<tailscale-ip>`), draait de browser in een **niet-beveiligde context** en blokkeert WebCrypto. Standaard **blokkeert** OpenClaw Control UI-verbindingen zonder apparaatidentiteit.

Gedocumenteerde uitzonderingen:

- alleen-localhost compatibiliteit met onveilige HTTP met `gateway.controlUi.allowInsecureAuth=true`
- geslaagde operator-Control UI-authenticatie via `gateway.auth.mode: "trusted-proxy"`
- noodoptie `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Aanbevolen oplossing:** gebruik HTTPS (Tailscale Serve) of open de UI lokaal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (op de Gateway-host)

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
  <Accordion title="Opmerking over trusted-proxy">
    - Geslaagde trusted-proxy-authenticatie kan **operator**-Control UI-sessies toelaten zonder apparaatidentiteit.
    - Dit geldt **niet** voor Control UI-sessies met een node-rol.
    - Reverse proxies via same-host loopback voldoen nog steeds niet aan trusted-proxy-authenticatie; zie [Trusted proxy-authenticatie](/nl/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Zie [Tailscale](/nl/gateway/tailscale) voor richtlijnen voor HTTPS-configuratie.

## Content Security Policy

De Control UI wordt geleverd met een strikt `img-src`-beleid: alleen assets van **dezelfde origin**, `data:`-URL's en lokaal gegenereerde `blob:`-URL's zijn toegestaan. Externe `http(s)`- en protocolrelatieve afbeeldings-URL's worden door de browser geweigerd en veroorzaken geen netwerkverzoeken.

Wat dit in de praktijk betekent:

- Avatars en afbeeldingen die via relatieve paden worden aangeboden (bijvoorbeeld `/avatars/<id>`) worden nog steeds weergegeven, inclusief geauthenticeerde avatar-routes die de UI ophaalt en omzet in lokale `blob:`-URL's.
- Inline `data:image/...`-URL's worden nog steeds weergegeven (handig voor payloads binnen het protocol).
- Lokale `blob:`-URL's die door de Control UI zijn aangemaakt, worden nog steeds weergegeven.
- Externe avatar-URL's die door kanaalmetadata worden uitgegeven, worden verwijderd door de avatarhelpers van de Control UI en vervangen door het ingebouwde logo/de ingebouwde badge, zodat een gecompromitteerd of kwaadaardig kanaal geen willekeurige externe afbeeldingsverzoeken vanuit een operatorbrowser kan afdwingen.

U hoeft niets te wijzigen om dit gedrag te krijgen — het staat altijd aan en is niet configureerbaar.

## Authenticatie voor avatar-route

Wanneer Gateway-authenticatie is geconfigureerd, vereist het avatar-eindpunt van de Control UI hetzelfde Gateway-token als de rest van de API:

- `GET /avatar/<agentId>` retourneert de avatarafbeelding alleen aan geauthenticeerde aanroepers. `GET /avatar/<agentId>?meta=1` retourneert de avatarmetadata onder dezelfde regel.
- Niet-geauthenticeerde verzoeken naar beide routes worden geweigerd (overeenkomstig de naastliggende assistant-media-route). Dit voorkomt dat de avatar-route agentidentiteit lekt op hosts die anders beschermd zijn.
- De Control UI zelf stuurt het Gateway-token door als bearer-header bij het ophalen van avatars, en gebruikt geauthenticeerde blob-URL's zodat de afbeelding nog steeds wordt weergegeven in dashboards.

Als u Gateway-authenticatie uitschakelt (niet aanbevolen op gedeelde hosts), wordt de avatar-route ook niet-geauthenticeerd, in lijn met de rest van de Gateway.

## Authenticatie voor assistant-media-route

Wanneer Gateway-authenticatie is geconfigureerd, gebruiken lokale-mediavoorbeelden van de assistant een route in twee stappen:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` vereist de normale operator-authenticatie van de Control UI. De browser verzendt het Gateway-token als bearer-header bij het controleren van beschikbaarheid.
- Geslaagde metadata-antwoorden bevatten een kortlevende `mediaTicket` die is beperkt tot dat exacte bronpad.
- Door de browser weergegeven URL's voor afbeeldingen, audio, video en documenten gebruiken `mediaTicket=<ticket>` in plaats van het actieve Gateway-token of wachtwoord. Het ticket verloopt snel en kan geen andere bron autoriseren.

Dit houdt normale mediaweergave compatibel met browser-native media-elementen zonder herbruikbare Gateway-referenties in zichtbare media-URL's te plaatsen.

## De UI bouwen

De Gateway levert statische bestanden vanuit `dist/control-ui`. Bouw ze met:

```bash
pnpm ui:build
```

Optionele absolute basis (wanneer u vaste asset-URL's wilt):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Voor lokale ontwikkeling (aparte dev-server):

```bash
pnpm ui:dev
```

Wijs de UI vervolgens naar uw Gateway-WS-URL (bijv. `ws://127.0.0.1:18789`).

## Debuggen/testen: dev-server + externe Gateway

De Control UI bestaat uit statische bestanden; het WebSocket-doel is configureerbaar en kan verschillen van de HTTP-origin. Dit is handig wanneer u de Vite-dev-server lokaal wilt gebruiken, maar de Gateway elders draait.

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
  <Accordion title="Opmerkingen">
    - `gatewayUrl` wordt na het laden opgeslagen in localStorage en uit de URL verwijderd.
    - Als u een volledig `ws://`- of `wss://`-eindpunt via `gatewayUrl` doorgeeft, URL-codeer dan de `gatewayUrl`-waarde zodat de browser de querystring correct parseert.
    - `token` moet waar mogelijk via het URL-fragment (`#token=...`) worden doorgegeven. Fragmenten worden niet naar de server verzonden, waardoor lekken via verzoeklogs en Referer wordt vermeden. Verouderde `?token=`-queryparameters worden voor compatibiliteit nog steeds eenmalig geïmporteerd, maar alleen als fallback, en worden direct na bootstrap verwijderd.
    - `password` wordt alleen in het geheugen bewaard.
    - Wanneer `gatewayUrl` is ingesteld, valt de UI niet terug op configuratie- of omgevingsreferenties. Geef `token` (of `password`) expliciet op. Ontbrekende expliciete referenties zijn een fout.
    - Gebruik `wss://` wanneer de Gateway achter TLS staat (Tailscale Serve, HTTPS-proxy, enz.).
    - `gatewayUrl` wordt alleen geaccepteerd in een top-level venster (niet ingesloten) om clickjacking te voorkomen.
    - Niet-loopback Control UI-implementaties moeten `gateway.controlUi.allowedOrigins` expliciet instellen (volledige origins). Dit omvat externe dev-opstellingen.
    - Het opstarten van de Gateway kan lokale origins zoals `http://localhost:<port>` en `http://127.0.0.1:<port>` initialiseren vanuit de effectieve runtime-bind en poort, maar externe browser-origins hebben nog steeds expliciete vermeldingen nodig.
    - Gebruik `gateway.controlUi.allowedOrigins: ["*"]` niet, behalve voor strikt gecontroleerde lokale tests. Het betekent elke browser-origin toestaan, niet "kom overeen met welke host ik ook gebruik."
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

Details voor configuratie van externe toegang: [Externe toegang](/nl/gateway/remote).

## Gerelateerd

- [Dashboard](/nl/web/dashboard) — Gateway-dashboard
- [Gezondheidscontroles](/nl/gateway/health) — gezondheidsbewaking van de Gateway
- [TUI](/nl/web/tui) — terminalgebruikersinterface
- [WebChat](/nl/web/webchat) — browsergebaseerde chatinterface
