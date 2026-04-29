---
read_when:
    - U wilt de Gateway vanuit een browser bedienen
    - Je wilt toegang tot Tailnet zonder SSH-tunnels
sidebarTitle: Control UI
summary: Browsergebaseerde beheer-UI voor de Gateway (chat, knooppunten, configuratie)
title: Bedienings-UI
x-i18n:
    generated_at: "2026-04-29T23:28:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: d440cb80ae194f1994fde90e58b65e6194d2f4f87534696818e3f92b2969265d
    source_path: web/control-ui.md
    workflow: 16
---

De Control UI is een kleine **Vite + Lit** single-page app die door de Gateway wordt geserveerd:

- standaard: `http://<host>:18789/`
- optionele prefix: stel `gateway.controlUi.basePath` in (bijv. `/openclaw`)

Hij communiceert **rechtstreeks met de Gateway WebSocket** op dezelfde poort.

## Snel openen (lokaal)

Als de Gateway op dezelfde computer draait, open dan:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (of [http://localhost:18789/](http://localhost:18789/))

Als de pagina niet laadt, start dan eerst de Gateway: `openclaw gateway`.

Auth wordt tijdens de WebSocket-handshake geleverd via:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve-identiteitsheaders wanneer `gateway.auth.allowTailscale: true`
- trusted-proxy-identiteitsheaders wanneer `gateway.auth.mode: "trusted-proxy"`

Het instellingenpaneel van het dashboard bewaart een token voor de huidige browsertabsessie en de geselecteerde Gateway-URL; wachtwoorden worden niet bewaard. Onboarding genereert meestal een gateway-token voor shared-secret-auth bij de eerste verbinding, maar wachtwoord-auth werkt ook wanneer `gateway.auth.mode` `"password"` is.

## Apparaat koppelen (eerste verbinding)

Wanneer je vanuit een nieuwe browser of vanaf een nieuw apparaat verbinding maakt met de Control UI, vereist de Gateway meestal een **eenmalige koppelingsgoedkeuring**. Dit is een beveiligingsmaatregel om onbevoegde toegang te voorkomen.

**Wat je ziet:** "verbinding verbroken (1008): koppeling vereist"

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

Als de browser opnieuw probeert te koppelen met gewijzigde auth-gegevens (rol/scopes/public key), wordt de vorige openstaande aanvraag vervangen en wordt er een nieuwe `requestId` gemaakt. Voer `openclaw devices list` opnieuw uit vóór goedkeuring.

Als de browser al is gekoppeld en je hem wijzigt van leestoegang naar schrijf-/admintoegang, wordt dit behandeld als een goedkeuringsupgrade, niet als een stille herverbinding. OpenClaw houdt de oude goedkeuring actief, blokkeert de bredere herverbinding en vraagt je om de nieuwe scopeset expliciet goed te keuren.

Na goedkeuring wordt het apparaat onthouden en is hergoedkeuring niet nodig, tenzij je het intrekt met `openclaw devices revoke --device <id> --role <role>`. Zie [Apparaten-CLI](/nl/cli/devices) voor tokenrotatie en intrekking.

<Note>
- Rechtstreekse local loopback-browserverbindingen (`127.0.0.1` / `localhost`) worden automatisch goedgekeurd.
- Tailscale Serve kan de koppelingsroundtrip voor Control UI-operatorsessies overslaan wanneer `gateway.auth.allowTailscale: true`, de Tailscale-identiteit wordt geverifieerd en de browser zijn apparaatidentiteit presenteert.
- Rechtstreekse Tailnet-binds, LAN-browserverbindingen en browserprofielen zonder apparaatidentiteit vereisen nog steeds expliciete goedkeuring.
- Elk browserprofiel genereert een unieke apparaat-ID, dus van browser wisselen of browsergegevens wissen vereist opnieuw koppelen.

</Note>

## Persoonlijke identiteit (browserlokaal)

De Control UI ondersteunt een persoonlijke identiteit per browser (weergavenaam en avatar) die aan uitgaande berichten wordt gekoppeld voor toeschrijving in gedeelde sessies. Deze staat in browseropslag, is beperkt tot het huidige browserprofiel en wordt niet gesynchroniseerd naar andere apparaten of server-side bewaard buiten de normale auteurschapsmetadata van transcripts op berichten die je daadwerkelijk verzendt. Sitegegevens wissen of van browser wisselen zet dit terug naar leeg.

Hetzelfde browserlokale patroon geldt voor de override van de assistentavatar. Geüploade assistentavatars leggen de door de gateway opgeloste identiteit alleen over de lokale browser heen en maken nooit een roundtrip via `config.patch`. Het gedeelde configuratieveld `ui.assistant.avatar` blijft beschikbaar voor niet-UI-clients die het veld rechtstreeks schrijven (zoals gescripte gateways of aangepaste dashboards).

## Runtimeconfiguratie-eindpunt

De Control UI haalt zijn runtime-instellingen op van `/__openclaw/control-ui-config.json`. Dat eindpunt wordt afgeschermd door dezelfde gateway-auth als de rest van het HTTP-oppervlak: niet-geauthenticeerde browsers kunnen het niet ophalen, en een geslaagde fetch vereist een al geldig gateway-token/wachtwoord, Tailscale Serve-identiteit of een trusted-proxy-identiteit.

## Taalondersteuning

De Control UI kan zichzelf bij de eerste laadactie lokaliseren op basis van je browserlocale. Om dit later te overschrijven, open je **Overzicht -> Gateway-toegang -> Taal**. De locale-kiezer staat in de Gateway-toegangskaart, niet onder Weergave.

- Ondersteunde locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Niet-Engelse vertalingen worden lazy-loaded in de browser.
- De geselecteerde locale wordt opgeslagen in browseropslag en opnieuw gebruikt bij toekomstige bezoeken.
- Ontbrekende vertaalsleutels vallen terug op Engels.

## Weergavethema's

Het Weergave-paneel behoudt de ingebouwde Claw-, Knot- en Dash-thema's, plus één browserlokale tweakcn-importslot. Om een thema te importeren, open je [tweakcn-thema's](https://tweakcn.com/themes), kies of maak je een thema, klik je op **Delen** en plak je de gekopieerde themalink in Weergave. De importer accepteert ook `https://tweakcn.com/r/themes/<id>`-registry-URL's, editor-URL's zoals `https://tweakcn.com/editor/theme?theme=amethyst-haze`, relatieve `/themes/<id>`-paden, ruwe thema-ID's en standaardthemanamen zoals `amethyst-haze`.

Geïmporteerde thema's worden alleen in het huidige browserprofiel opgeslagen. Ze worden niet naar gateway-configuratie geschreven en synchroniseren niet tussen apparaten. Het geïmporteerde thema vervangen werkt het ene lokale slot bij; het wissen schakelt het actieve thema terug naar Claw als het geïmporteerde thema was geselecteerd.

## Wat het kan doen (vandaag)

<AccordionGroup>
  <Accordion title="Chat en Talk">
    - Chat met het model via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Praat via browser-realtime-sessies. OpenAI gebruikt directe WebRTC, Google Live gebruikt een beperkt eenmalig browsertoken via WebSocket, en backend-only realtime spraakplugins gebruiken het Gateway-relaytransport. De relay houdt providerreferenties op de Gateway terwijl de browser microfoon-PCM streamt via `talk.realtime.relay*`-RPC's en `openclaw_agent_consult`-toolaanroepen terugstuurt via `chat.send` voor het grotere geconfigureerde OpenClaw-model.
    - Stream toolaanroepen + live tooluitvoerkaarten in Chat (agentgebeurtenissen).

  </Accordion>
  <Accordion title="Kanalen, instanties, sessies, dromen">
    - Kanalen: ingebouwde plus gebundelde/externe Plugin-kanalenstatus, QR-login en configuratie per kanaal (`channels.status`, `web.login.*`, `config.patch`).
    - Instanties: aanwezigheidslijst + vernieuwen (`system-presence`).
    - Sessies: lijst + model-/thinking-/fast-/verbose-/trace-/reasoning-overrides per sessie (`sessions.list`, `sessions.patch`).
    - Dromen: Dreaming-status, in-/uitschakelschakelaar en Dream Diary-lezer (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, Nodes, exec-goedkeuringen">
    - Cron-taken: weergeven/toevoegen/bewerken/uitvoeren/inschakelen/uitschakelen + uitvoeringsgeschiedenis (`cron.*`).
    - Skills: status, inschakelen/uitschakelen, installeren, API-sleutelupdates (`skills.*`).
    - Nodes: lijst + caps (`node.list`).
    - Exec-goedkeuringen: gateway- of node-allowlists bewerken + vraagbeleid voor `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuratie">
    - Bekijk/bewerk `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Toepassen + opnieuw starten met validatie (`config.apply`) en de laatst actieve sessie wekken.
    - Schrijfacties bevatten een base-hash-bewaking om te voorkomen dat gelijktijdige bewerkingen worden overschreven.
    - Schrijfacties (`config.set`/`config.apply`/`config.patch`) voeren vooraf controle uit op actieve SecretRef-resolutie voor refs in de ingediende configuratiepayload; niet-opgeloste actieve ingediende refs worden vóór het schrijven geweigerd.
    - Schema + formulierweergave (`config.schema` / `config.schema.lookup`, inclusief veld `title` / `description`, overeenkomende UI-hints, directe kind-samenvattingen, docsmetadata op geneste object-/wildcard-/array-/compositienodes, plus plugin- en kanaalschema's wanneer beschikbaar); Raw JSON-editor is alleen beschikbaar wanneer de snapshot een veilige ruwe roundtrip heeft.
    - Als een snapshot ruwe tekst niet veilig kan roundtrippen, dwingt Control UI de Form-modus af en schakelt Raw-modus uit voor die snapshot.
    - Raw JSON-editor "Terugzetten naar opgeslagen" behoudt de ruwe geschreven vorm (opmaak, opmerkingen, `$include`-layout) in plaats van een afgevlakte snapshot opnieuw te renderen, zodat externe bewerkingen een reset overleven wanneer de snapshot veilig kan roundtrippen.
    - Gestructureerde SecretRef-objectwaarden worden alleen-lezen weergegeven in formuliertekstinvoer om onbedoelde object-naar-string-corruptie te voorkomen.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debug: status-/health-/modellen-snapshots + gebeurtenislog + handmatige RPC-aanroepen (`status`, `health`, `models.list`).
    - Logs: live tail van gateway-bestandslogs met filter/export (`logs.tail`).
    - Update: voer een pakket-/git-update + herstart uit (`update.run`) met een herstartrapport, en poll daarna `update.status` na herverbinding om de draaiende gateway-versie te verifiëren.

  </Accordion>
  <Accordion title="Paneelnotities voor Cron-taken">
    - Voor geïsoleerde taken is de standaardlevering samenvatting aankondigen. Je kunt overschakelen naar geen als je alleen-interne runs wilt.
    - Kanaal-/doelvelden verschijnen wanneer aankondigen is geselecteerd.
    - Webhook-modus gebruikt `delivery.mode = "webhook"` met `delivery.to` ingesteld op een geldige HTTP(S)-webhook-URL.
    - Voor hoofdsessietaken zijn Webhook- en geen-leveringsmodi beschikbaar.
    - Geavanceerde bewerkingscontroles omvatten verwijderen-na-run, agent-override wissen, Cron exact/stagger-opties, agentmodel-/thinking-overrides en best-effort-leveringsschakelaars.
    - Formuliervalidatie is inline met fouten op veldniveau; ongeldige waarden schakelen de opslagknop uit totdat ze zijn opgelost.
    - Stel `cron.webhookToken` in om een toegewezen bearer-token te verzenden; als dit wordt weggelaten, wordt de Webhook zonder auth-header verzonden.
    - Verouderde fallback: opgeslagen legacy-taken met `notify: true` kunnen nog steeds `cron.webhook` gebruiken totdat ze zijn gemigreerd.

  </Accordion>
</AccordionGroup>

## Chatgedrag

<AccordionGroup>
  <Accordion title="Verzend- en geschiedenissemantiek">
    - `chat.send` is **niet-blokkerend**: het bevestigt onmiddellijk met `{ runId, status: "started" }` en de respons wordt gestreamd via `chat`-events.
    - Chat-uploads accepteren afbeeldingen plus niet-videobestanden. Afbeeldingen behouden het native afbeeldingspad; andere bestanden worden opgeslagen als beheerde media en in de geschiedenis getoond als bijlagelinks.
    - Opnieuw verzenden met dezelfde `idempotencyKey` retourneert `{ status: "in_flight" }` terwijl het actief is, en `{ status: "ok" }` na voltooiing.
    - `chat.history`-responsen zijn qua grootte begrensd voor UI-veiligheid. Wanneer transcriptitems te groot zijn, kan de Gateway lange tekstvelden afkappen, zware metadatablokken weglaten en te grote berichten vervangen door een placeholder (`[chat.history omitted: message too large]`).
    - Door de assistent/gegenereerde afbeeldingen worden bewaard als beheerde mediareferenties en teruggeleverd via geauthenticeerde Gateway-media-URL's, zodat herladen niet afhankelijk is van raw base64-afbeeldingspayloads die in de chatgeschiedenisrespons blijven staan.
    - `chat.history` verwijdert ook display-only inline directive-tags uit zichtbare assistenttekst (bijvoorbeeld `[[reply_to_*]]` en `[[audio_as_voice]]`), plattetekst-tool-call-XML-payloads (inclusief `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en afgekorte tool-call-blokken), en gelekte ASCII-/full-width-modelcontroletokens, en laat assistentitems weg waarvan de volledige zichtbare tekst alleen het exacte stille token `NO_REPLY` / `no_reply` is.
    - Tijdens een actieve verzending en de laatste geschiedenisverversing houdt de chatweergave lokale optimistische gebruikers-/assistentberichten zichtbaar als `chat.history` kort een oudere momentopname retourneert; het canonieke transcript vervangt die lokale berichten zodra de Gateway-geschiedenis is bijgewerkt.
    - `chat.inject` voegt een assistentnotitie toe aan het sessietranscript en broadcast een `chat`-event voor updates alleen voor de UI (geen agent-run, geen kanaalaflevering).
    - De model- en denkkeuzes in de chatkop patchen de actieve sessie onmiddellijk via `sessions.patch`; het zijn blijvende sessie-overschrijvingen, geen verzendopties voor slechts één beurt.
    - De chatmodelkiezer vraagt de geconfigureerde modelweergave van de Gateway op. Als `agents.defaults.models` aanwezig is, stuurt die allowlist de kiezer aan. Anders toont de kiezer expliciete `models.providers.*.models`-items plus providers met bruikbare auth. De volledige catalogus blijft beschikbaar via de debug-`models.list`-RPC met `view: "all"`.
    - Wanneer verse gebruiksrapporten van de Gateway-sessie hoge contextdruk tonen, toont het chatcomposergebied een contextmelding en, bij aanbevolen Compaction-niveaus, een compacte knop die het normale sessie-Compaction-pad uitvoert. Verouderde tokenmomentopnamen worden verborgen totdat de Gateway opnieuw vers gebruik rapporteert.

  </Accordion>
  <Accordion title="Praatmodus (browser-realtime)">
    Praatmodus gebruikt een geregistreerde realtime spraakprovider. Configureer OpenAI met `talk.provider: "openai"` plus `talk.providers.openai.apiKey`, of configureer Google met `talk.provider: "google"` plus `talk.providers.google.apiKey`; de realtime providerconfiguratie voor Voice Call kan nog steeds opnieuw worden gebruikt als fallback. De browser ontvangt nooit een standaard provider-API-sleutel. OpenAI ontvangt een tijdelijk Realtime-clientsecret voor WebRTC. Google Live ontvangt een eenmalig beperkt Live API-auth-token voor een browser-WebSocket-sessie, waarbij instructies en tooldeclaraties door de Gateway in het token zijn vastgezet. Providers die alleen een backend realtime bridge beschikbaar stellen, lopen via het Gateway-relaytransport, zodat referenties en leverancierssockets server-side blijven terwijl browseraudio via geauthenticeerde Gateway-RPC's loopt. De Realtime-sessieprompt wordt samengesteld door de Gateway; `talk.realtime.session` accepteert geen door de aanroeper aangeleverde instructie-overschrijvingen.

    In de Chat-composer is de Talk-bediening de golvenknop naast de microfoonknop voor dictatie. Wanneer Talk start, toont de composerstatusrij `Connecting Talk...`, daarna `Talk live` terwijl audio is verbonden, of `Asking OpenClaw...` terwijl een realtime tool-call het geconfigureerde grotere model raadpleegt via `chat.send`.

    Maintainer live smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifieert de OpenAI browser-WebRTC-SDP-uitwisseling, de Google Live browser-WebSocket-installatie met beperkt token en de Gateway-relay-browseradapter met nep-microfoonmedia. De opdracht print alleen providerstatus en logt geen secrets.

  </Accordion>
  <Accordion title="Stoppen en afbreken">
    - Klik op **Stop** (roept `chat.abort` aan).
    - Terwijl een run actief is, worden normale vervolgberichten in de wachtrij gezet. Klik op **Sturen** bij een bericht in de wachtrij om dat vervolgbericht in de lopende beurt te injecteren.
    - Typ `/stop` (of zelfstandige afbreekzinnen zoals `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) om out-of-band af te breken.
    - `chat.abort` ondersteunt `{ sessionKey }` (geen `runId`) om alle actieve runs voor die sessie af te breken.

  </Accordion>
  <Accordion title="Behoud van gedeeltelijke inhoud na afbreken">
    - Wanneer een run wordt afgebroken, kan gedeeltelijke assistenttekst nog steeds in de UI worden getoond.
    - Gateway bewaart afgebroken gedeeltelijke assistenttekst in de transcriptgeschiedenis wanneer gebufferde uitvoer bestaat.
    - Bewaarde items bevatten afbreekmetadata zodat transcriptconsumenten gedeeltelijke afbreekuitvoer kunnen onderscheiden van normale voltooiingsuitvoer.

  </Accordion>
</AccordionGroup>

## PWA-installatie en Web Push

De Control UI levert een `manifest.webmanifest` en een serviceworker, zodat moderne browsers deze als zelfstandige PWA kunnen installeren. Web Push laat de Gateway de geïnstalleerde PWA wekken met meldingen, zelfs wanneer het tabblad of browservenster niet open is.

| Oppervlak                                             | Wat het doet                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA-manifest. Browsers bieden "App installeren" aan zodra het bereikbaar is. |
| `ui/public/sw.js`                                     | Serviceworker die `push`-events en meldingsklikken afhandelt. |
| `push/vapid-keys.json` (onder de OpenClaw-statusmap) | Automatisch gegenereerd VAPID-sleutelpaar dat wordt gebruikt om Web Push-payloads te ondertekenen. |
| `push/web-push-subscriptions.json`                    | Bewaarde browserabonnement-endpoints.                              |

Overschrijf het VAPID-sleutelpaar via env-vars op het Gateway-proces wanneer je sleutels wilt vastzetten (voor multi-host deployments, secretrotatie of tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (standaard `mailto:openclaw@localhost`)

De Control UI gebruikt deze scope-afgeschermde Gateway-methoden om browserabonnementen te registreren en testen:

- `push.web.vapidPublicKey` — haalt de actieve openbare VAPID-sleutel op.
- `push.web.subscribe` — registreert een `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — verwijdert een geregistreerd endpoint.
- `push.web.test` — stuurt een testmelding naar het abonnement van de aanroeper.

<Note>
Web Push staat los van het iOS APNS-relaypad (zie [Configuratie](/nl/gateway/configuration) voor relay-ondersteunde push) en de bestaande `push.test`-methode, die gericht zijn op native mobiele koppeling.
</Note>

## Gehoste embeds

Assistentberichten kunnen gehoste webinhoud inline renderen met de `[embed ...]`-shortcode. Het iframe-sandboxbeleid wordt beheerd door `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Schakelt scriptuitvoering binnen gehoste embeds uit.
  </Tab>
  <Tab title="scripts (standaard)">
    Staat interactieve embeds toe terwijl oorsprongisolatie behouden blijft; dit is de standaard en is meestal voldoende voor zelfstandige browsergames/widgets.
  </Tab>
  <Tab title="trusted">
    Voegt `allow-same-origin` toe boven op `allow-scripts` voor same-site-documenten die bewust sterkere rechten nodig hebben.
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
Gebruik `trusted` alleen wanneer het ingesloten document echt same-origin-gedrag nodig heeft. Voor de meeste door agenten gegenereerde games en interactieve canvassen is `scripts` de veiligere keuze.
</Warning>

Absolute externe `http(s)`-embed-URL's blijven standaard geblokkeerd. Als je bewust wilt dat `[embed url="https://..."]` pagina's van derden laadt, stel dan `gateway.controlUi.allowExternalEmbedUrls: true` in.

## Tailnet-toegang (aanbevolen)

<Tabs>
  <Tab title="Geïntegreerde Tailscale Serve (voorkeur)">
    Houd de Gateway op local loopback en laat Tailscale Serve deze proxyen met HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Open:

    - `https://<magicdns>/` (of je geconfigureerde `gateway.controlUi.basePath`)

    Standaard kunnen Control UI-/WebSocket Serve-verzoeken authenticeren via Tailscale-identiteitsheaders (`tailscale-user-login`) wanneer `gateway.auth.allowTailscale` `true` is. OpenClaw verifieert de identiteit door het `x-forwarded-for`-adres op te lossen met `tailscale whois` en dit te matchen met de header, en accepteert deze alleen wanneer het verzoek local loopback bereikt met de `x-forwarded-*`-headers van Tailscale. Voor Control UI-operatorsessies met browserapparaatidentiteit slaat dit geverifieerde Serve-pad ook de apparaatkoppelingsronde over; browsers zonder apparaat en node-role-verbindingen volgen nog steeds de normale apparaatcontroles. Stel `gateway.auth.allowTailscale: false` in als je expliciete shared-secret-referenties wilt vereisen, zelfs voor Serve-verkeer. Gebruik daarna `gateway.auth.mode: "token"` of `"password"`.

    Voor dat asynchrone Serve-identiteitspad worden mislukte auth-pogingen voor hetzelfde client-IP en dezelfde auth-scope geserialiseerd voordat rate-limit-writes plaatsvinden. Gelijktijdige foutieve nieuwe pogingen vanuit dezelfde browser kunnen daarom `retry later` tonen bij het tweede verzoek in plaats van twee gewone mismatches die parallel racen.

    <Warning>
    Tokenloze Serve-auth gaat ervan uit dat de gatewayhost vertrouwd is. Als niet-vertrouwde lokale code op die host kan draaien, vereis dan token-/wachtwoordauth.
    </Warning>

  </Tab>
  <Tab title="Binden aan tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Open daarna:

    - `http://<tailscale-ip>:18789/` (of je geconfigureerde `gateway.controlUi.basePath`)

    Plak het overeenkomende shared secret in de UI-instellingen (verzonden als `connect.params.auth.token` of `connect.params.auth.password`).

  </Tab>
</Tabs>

## Onveilige HTTP

Als je het dashboard opent via platte HTTP (`http://<lan-ip>` of `http://<tailscale-ip>`), draait de browser in een **niet-beveiligde context** en blokkeert WebCrypto. Standaard **blokkeert** OpenClaw Control UI-verbindingen zonder apparaatidentiteit.

Gedocumenteerde uitzonderingen:

- alleen-localhost onveilige HTTP-compatibiliteit met `gateway.controlUi.allowInsecureAuth=true`
- succesvolle operator-Control UI-auth via `gateway.auth.mode: "trusted-proxy"`
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Aanbevolen oplossing:** gebruik HTTPS (Tailscale Serve) of open de UI lokaal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (op de gatewayhost)

<AccordionGroup>
  <Accordion title="Gedrag van insecure-auth-schakelaar">
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

    - Het staat localhost-Control UI-sessies toe om zonder apparaatidentiteit door te gaan in niet-beveiligde HTTP-contexten.
    - Het omzeilt geen koppelingscontroles.
    - Het versoepelt geen vereisten voor apparaatidentiteit op afstand (niet-localhost).

  </Accordion>
  <Accordion title="Alleen break-glass">
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
    `dangerouslyDisableDeviceAuth` schakelt identiteitscontroles voor Control UI-apparaten uit en is een ernstige beveiligingsverlaging. Draai dit snel terug na noodgebruik.
    </Warning>

  </Accordion>
  <Accordion title="Opmerking over vertrouwde proxy">
    - Succesvolle vertrouwde-proxy-authenticatie kan **operator**-sessies in de Control UI toelaten zonder apparaatidentiteit.
    - Dit geldt **niet** voor Control UI-sessies met node-rol.
    - Reverse proxies via loopback op dezelfde host voldoen nog steeds niet aan vertrouwde-proxy-authenticatie; zie [Vertrouwde-proxy-authenticatie](/nl/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Zie [Tailscale](/nl/gateway/tailscale) voor richtlijnen voor HTTPS-configuratie.

## Beleid voor contentbeveiliging

De Control UI wordt geleverd met een strikt `img-src`-beleid: alleen assets van **dezelfde origin**, `data:`-URL's en lokaal gegenereerde `blob:`-URL's zijn toegestaan. Externe `http(s)`- en protocolrelatieve afbeeldings-URL's worden door de browser geweigerd en veroorzaken geen netwerkverzoeken.

Wat dit in de praktijk betekent:

- Avatars en afbeeldingen die via relatieve paden worden aangeboden (bijvoorbeeld `/avatars/<id>`) worden nog steeds weergegeven, inclusief geauthenticeerde avatarroutes die de UI ophaalt en omzet naar lokale `blob:`-URL's.
- Inline `data:image/...`-URL's worden nog steeds weergegeven (handig voor payloads binnen het protocol).
- Lokale `blob:`-URL's die door de Control UI zijn gemaakt, worden nog steeds weergegeven.
- Externe avatar-URL's die door kanaalmetadata worden uitgegeven, worden door de avatarhelpers van de Control UI verwijderd en vervangen door het ingebouwde logo/de ingebouwde badge, zodat een gecompromitteerd of kwaadwillig kanaal geen willekeurige externe afbeeldingsverzoeken vanuit de browser van een operator kan afdwingen.

Je hoeft niets te wijzigen om dit gedrag te krijgen — het staat altijd aan en is niet configureerbaar.

## Authenticatie voor avatarroutes

Wanneer Gateway-authenticatie is geconfigureerd, vereist het avatarendpoint van de Control UI hetzelfde Gateway-token als de rest van de API:

- `GET /avatar/<agentId>` retourneert de avatarafbeelding alleen aan geauthenticeerde callers. `GET /avatar/<agentId>?meta=1` retourneert de avatarmetadata onder dezelfde regel.
- Niet-geauthenticeerde verzoeken naar beide routes worden geweigerd (overeenkomstig de naastgelegen assistant-media-route). Dit voorkomt dat de avatarroute agentidentiteit lekt op hosts die verder beschermd zijn.
- De Control UI stuurt het Gateway-token zelf door als bearer-header bij het ophalen van avatars en gebruikt geauthenticeerde blob-URL's zodat de afbeelding nog steeds in dashboards wordt weergegeven.

Als je Gateway-authenticatie uitschakelt (niet aanbevolen op gedeelde hosts), wordt de avatarroute ook niet-geauthenticeerd, in lijn met de rest van de Gateway.

## De UI bouwen

De Gateway serveert statische bestanden vanuit `dist/control-ui`. Bouw ze met:

```bash
pnpm ui:build
```

Optionele absolute basis (wanneer je vaste asset-URL's wilt):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Voor lokale ontwikkeling (aparte ontwikkelserver):

```bash
pnpm ui:dev
```

Wijs de UI daarna naar je Gateway WS-URL (bijv. `ws://127.0.0.1:18789`).

## Debuggen/testen: ontwikkelserver + externe Gateway

De Control UI bestaat uit statische bestanden; het WebSocket-doel is configureerbaar en kan verschillen van de HTTP-origin. Dit is handig wanneer je de Vite-ontwikkelserver lokaal wilt gebruiken maar de Gateway elders draait.

<Steps>
  <Step title="Start de UI-ontwikkelserver">
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
    - Als je een volledig `ws://`- of `wss://`-endpoint via `gatewayUrl` doorgeeft, URL-encodeer dan de waarde van `gatewayUrl` zodat de browser de querystring correct verwerkt.
    - `token` moet waar mogelijk via het URL-fragment (`#token=...`) worden doorgegeven. Fragmenten worden niet naar de server gestuurd, waardoor lekkage via verzoeklogs en Referer wordt voorkomen. Verouderde `?token=`-queryparameters worden voor compatibiliteit nog steeds eenmaal geïmporteerd, maar alleen als fallback, en worden direct na bootstrap verwijderd.
    - `password` wordt alleen in het geheugen bewaard.
    - Wanneer `gatewayUrl` is ingesteld, valt de UI niet terug op configuratie- of omgevingsreferenties. Geef `token` (of `password`) expliciet op. Ontbrekende expliciete referenties zijn een fout.
    - Gebruik `wss://` wanneer de Gateway achter TLS staat (Tailscale Serve, HTTPS-proxy, enz.).
    - `gatewayUrl` wordt alleen geaccepteerd in een venster op topniveau (niet ingesloten) om clickjacking te voorkomen.
    - Niet-loopback Control UI-implementaties moeten `gateway.controlUi.allowedOrigins` expliciet instellen (volledige origins). Dit omvat externe ontwikkelopstellingen.
    - Bij het opstarten van de Gateway kunnen lokale origins zoals `http://localhost:<port>` en `http://127.0.0.1:<port>` worden ingevuld op basis van de effectieve runtime-bind en poort, maar externe browser-origins hebben nog steeds expliciete vermeldingen nodig.
    - Gebruik `gateway.controlUi.allowedOrigins: ["*"]` niet, behalve voor strikt gecontroleerde lokale tests. Het betekent dat elke browser-origin wordt toegestaan, niet "koppel aan de host die ik gebruik."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` schakelt de fallbackmodus voor Host-header-origin in, maar dit is een gevaarlijke beveiligingsmodus.

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

Details over configuratie voor externe toegang: [Externe toegang](/nl/gateway/remote).

## Gerelateerd

- [Dashboard](/nl/web/dashboard) — Gateway-dashboard
- [Health Checks](/nl/gateway/health) — Gateway-gezondheidsbewaking
- [TUI](/nl/web/tui) — terminalgebruikersinterface
- [WebChat](/nl/web/webchat) — browsergebaseerde chatinterface
