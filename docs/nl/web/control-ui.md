---
read_when:
    - Je wilt de Gateway vanuit een browser bedienen
    - Je wilt Tailnet-toegang zonder SSH-tunnels
sidebarTitle: Control UI
summary: Browsergebaseerde beheerinterface voor de Gateway (chat, knooppunten, configuratie)
title: Bedieningsinterface
x-i18n:
    generated_at: "2026-05-04T07:10:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 07fbbe1c7fec5f67a04a231e02bdf0f7d16be9c5fe188915674d71fcd69002a5
    source_path: web/control-ui.md
    workflow: 16
---

De Control UI is een kleine **Vite + Lit** single-page-app die door de Gateway wordt geserveerd:

- standaard: `http://<host>:18789/`
- optioneel prefix: stel `gateway.controlUi.basePath` in (bijv. `/openclaw`)

Deze communiceert **rechtstreeks met de Gateway WebSocket** op dezelfde poort.

## Snel openen (lokaal)

Als de Gateway op dezelfde computer draait, open:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (of [http://localhost:18789/](http://localhost:18789/))

Als de pagina niet laadt, start dan eerst de Gateway: `openclaw gateway`.

Authenticatie wordt tijdens de WebSocket-handshake geleverd via:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve-identiteitsheaders wanneer `gateway.auth.allowTailscale: true`
- trusted-proxy-identiteitsheaders wanneer `gateway.auth.mode: "trusted-proxy"`

Het instellingenpaneel van het dashboard bewaart een token voor de huidige browsertabsessie en geselecteerde gateway-URL; wachtwoorden worden niet bewaard. Onboarding genereert meestal een gateway-token voor shared-secret-authenticatie bij de eerste verbinding, maar wachtwoordauthenticatie werkt ook wanneer `gateway.auth.mode` `"password"` is.

## Apparaatkoppeling (eerste verbinding)

Wanneer je vanaf een nieuwe browser of apparaat verbinding maakt met de Control UI, vereist de Gateway meestal een **eenmalige koppelingsgoedkeuring**. Dit is een beveiligingsmaatregel om ongeautoriseerde toegang te voorkomen.

**Wat je ziet:** "verbinding verbroken (1008): koppeling vereist"

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

Als de browser opnieuw probeert te koppelen met gewijzigde authenticatiegegevens (rol/scopes/openbare sleutel), wordt het vorige openstaande verzoek vervangen en wordt er een nieuwe `requestId` aangemaakt. Voer `openclaw devices list` opnieuw uit vóór goedkeuring.

Als de browser al gekoppeld is en je deze wijzigt van leestoegang naar schrijf-/beheerderstoegang, wordt dit behandeld als een goedkeuringsupgrade, niet als een stille herverbinding. OpenClaw houdt de oude goedkeuring actief, blokkeert de bredere herverbinding en vraagt je de nieuwe set scopes expliciet goed te keuren.

Na goedkeuring wordt het apparaat onthouden en is geen hernieuwde goedkeuring vereist, tenzij je het intrekt met `openclaw devices revoke --device <id> --role <role>`. Zie [Apparaten-CLI](/nl/cli/devices) voor tokenrotatie en intrekking.

<Note>
- Rechtstreekse local loopback-browserverbindingen (`127.0.0.1` / `localhost`) worden automatisch goedgekeurd.
- Tailscale Serve kan de koppelingsronde overslaan voor Control UI-operatorsessies wanneer `gateway.auth.allowTailscale: true`, Tailscale-identiteit wordt geverifieerd en de browser zijn apparaatidentiteit presenteert.
- Rechtstreekse Tailnet-binds, LAN-browserverbindingen en browserprofielen zonder apparaatidentiteit vereisen nog steeds expliciete goedkeuring.
- Elk browserprofiel genereert een unieke apparaat-ID, dus wisselen van browser of browsergegevens wissen vereist opnieuw koppelen.

</Note>

## Persoonlijke identiteit (browser-lokaal)

De Control UI ondersteunt een persoonlijke identiteit per browser (weergavenaam en avatar) die aan uitgaande berichten wordt gekoppeld voor attributie in gedeelde sessies. Deze staat in browseropslag, is beperkt tot het huidige browserprofiel en wordt niet gesynchroniseerd naar andere apparaten of server-side bewaard buiten de normale auteurschapsmetadata van transcripties op berichten die je daadwerkelijk verstuurt. Sitegegevens wissen of van browser wisselen zet deze terug naar leeg.

Hetzelfde browser-lokale patroon geldt voor de override van de assistentavatar. Geüploade assistentavatars overlappen de door de gateway opgeloste identiteit alleen in de lokale browser en maken nooit een round-trip via `config.patch`. Het gedeelde configuratieveld `ui.assistant.avatar` blijft beschikbaar voor niet-UI-clients die het veld rechtstreeks schrijven (zoals scripted gateways of aangepaste dashboards).

## Runtime-configuratie-eindpunt

De Control UI haalt zijn runtime-instellingen op van `/__openclaw/control-ui-config.json`. Dat eindpunt wordt afgeschermd door dezelfde gateway-authenticatie als de rest van het HTTP-oppervlak: niet-geauthenticeerde browsers kunnen het niet ophalen, en een succesvolle fetch vereist een al geldig gateway-token/wachtwoord, Tailscale Serve-identiteit of een trusted-proxy-identiteit.

## Taalondersteuning

De Control UI kan zichzelf bij de eerste laadbeurt lokaliseren op basis van je browserlocale. Om dit later te overschrijven, open **Overzicht -> Gateway-toegang -> Taal**. De locale-kiezer staat in de Gateway-toegangskaart, niet onder Uiterlijk.

- Ondersteunde locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Niet-Engelse vertalingen worden lazy-loaded in de browser.
- De geselecteerde locale wordt opgeslagen in browseropslag en hergebruikt bij toekomstige bezoeken.
- Ontbrekende vertaalsleutels vallen terug op Engels.

Documentatievertalingen worden gegenereerd voor dezelfde niet-Engelse localeset, maar de ingebouwde Mintlify-taalkiezer van de documentatiesite is beperkt tot de locale-codes die Mintlify accepteert. Thaise (`th`) en Perzische (`fa`) documentatie wordt nog steeds gegenereerd in de publicatierepo; deze verschijnt mogelijk pas in die kiezer wanneer Mintlify die codes ondersteunt.

## Uiterlijkthema's

Het paneel Uiterlijk behoudt de ingebouwde Claw-, Knot- en Dash-thema's, plus één browser-lokaal tweakcn-importslot. Om een thema te importeren, open [tweakcn editor](https://tweakcn.com/editor/theme), kies of maak een thema, klik op **Delen** en plak de gekopieerde themalink in Uiterlijk. De importfunctie accepteert ook `https://tweakcn.com/r/themes/<id>`-registry-URL's, editor-URL's zoals `https://tweakcn.com/editor/theme?theme=amethyst-haze`, relatieve `/themes/<id>`-paden, ruwe thema-ID's en standaardthemanamen zoals `amethyst-haze`.

Geïmporteerde thema's worden alleen opgeslagen in het huidige browserprofiel. Ze worden niet naar de gateway-configuratie geschreven en synchroniseren niet tussen apparaten. Het vervangen van het geïmporteerde thema werkt het ene lokale slot bij; wissen schakelt het actieve thema terug naar Claw als het geïmporteerde thema geselecteerd was.

## Wat het kan doen (vandaag)

<AccordionGroup>
  <Accordion title="Chat en Talk">
    - Chat met het model via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Praat via realtime browsersessies. OpenAI gebruikt directe WebRTC, Google Live gebruikt een beperkt eenmalig browser-token via WebSocket, en realtime spraakplugins die alleen op de backend draaien gebruiken het Gateway-relaytransport. De relay houdt providerreferenties op de Gateway terwijl de browser microfoon-PCM streamt via `talk.realtime.relay*`-RPC's en `openclaw_agent_consult`-toolaanroepen terugstuurt via `chat.send` voor het grotere geconfigureerde OpenClaw-model.
    - Stream toolaanroepen + live tooluitvoerkaarten in Chat (agentgebeurtenissen).

  </Accordion>
  <Accordion title="Kanalen, instanties, sessies, dromen">
    - Kanalen: ingebouwde plus gebundelde/externe pluginkanalenstatus, QR-login en configuratie per kanaal (`channels.status`, `web.login.*`, `config.patch`).
    - Instanties: aanwezigheidslijst + vernieuwen (`system-presence`).
    - Sessies: lijst + overrides per sessie voor model/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`).
    - Dromen: Dreaming-status, in-/uitschakelaar en Dream Diary-lezer (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec-goedkeuringen">
    - Cron-taken: weergeven/toevoegen/bewerken/uitvoeren/inschakelen/uitschakelen + uitvoeringsgeschiedenis (`cron.*`).
    - Skills: status, inschakelen/uitschakelen, installeren, API-sleutelupdates (`skills.*`).
    - Nodes: lijst + caps (`node.list`).
    - Exec-goedkeuringen: gateway- of node-allowlists bewerken + vraagbeleid voor `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuratie">
    - Bekijk/bewerk `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Toepassen + opnieuw starten met validatie (`config.apply`) en de laatst actieve sessie wekken.
    - Schrijfbewerkingen bevatten een base-hash-beveiliging om te voorkomen dat gelijktijdige bewerkingen worden overschreven.
    - Schrijfbewerkingen (`config.set`/`config.apply`/`config.patch`) voeren vooraf actieve SecretRef-resolutie uit voor refs in de ingediende configuratiepayload; niet-opgeloste actieve ingediende refs worden vóór schrijven geweigerd.
    - Schema + formulierweergave (`config.schema` / `config.schema.lookup`, inclusief veld `title` / `description`, overeenkomende UI-hints, directe samenvattingen van children, documentatiemetadata op geneste object-/wildcard-/array-/composition-nodes, plus plugin- en kanaalschema's wanneer beschikbaar); de Raw JSON-editor is alleen beschikbaar wanneer de snapshot een veilige raw round-trip heeft.
    - Als een snapshot niet veilig raw tekst kan round-trippen, dwingt Control UI de formuliermodus af en schakelt Raw-modus uit voor die snapshot.
    - Raw JSON-editor "Terugzetten naar opgeslagen" behoudt de raw-aangemaakte vorm (opmaak, opmerkingen, `$include`-layout) in plaats van een afgevlakte snapshot opnieuw te renderen, zodat externe bewerkingen een reset overleven wanneer de snapshot veilig kan round-trippen.
    - Gestructureerde SecretRef-objectwaarden worden read-only weergegeven in formuliertekstinvoeren om onbedoelde corruptie van object naar string te voorkomen.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debug: status-/health-/models-snapshots + gebeurtenislog + handmatige RPC-aanroepen (`status`, `health`, `models.list`).
    - Logs: live tail van gateway-bestandslogs met filter/export (`logs.tail`).
    - Update: voer een package-/git-update + herstart uit (`update.run`) met een herstartrapport, en poll daarna `update.status` na herverbinding om de draaiende gateway-versie te verifiëren.

  </Accordion>
  <Accordion title="Opmerkingen bij het Cron-takenpaneel">
    - Voor geïsoleerde taken is de standaardlevering een aankondigingssamenvatting. Je kunt overschakelen naar geen als je alleen interne uitvoeringen wilt.
    - Kanaal-/doelvelden verschijnen wanneer aankondigen is geselecteerd.
    - Webhook-modus gebruikt `delivery.mode = "webhook"` met `delivery.to` ingesteld op een geldige HTTP(S)-webhook-URL.
    - Voor taken in de hoofdsessie zijn webhook- en geen-leveringsmodi beschikbaar.
    - Geavanceerde bewerkingsopties omvatten verwijderen na uitvoeren, agentoverride wissen, cron exact/stagger-opties, overrides voor agentmodel/thinking en best-effort-leveringsschakelaars.
    - Formuliervalidatie is inline met fouten per veld; ongeldige waarden schakelen de knop Opslaan uit totdat ze zijn gecorrigeerd.
    - Stel `cron.webhookToken` in om een speciale bearer token te sturen; als dit wordt weggelaten, wordt de webhook zonder auth-header verzonden.
    - Verouderde fallback: opgeslagen legacy-taken met `notify: true` kunnen nog steeds `cron.webhook` gebruiken totdat ze zijn gemigreerd.

  </Accordion>
</AccordionGroup>

## Chatgedrag

<AccordionGroup>
  <Accordion title="Semantiek voor verzenden en geschiedenis">
    - `chat.send` is **niet-blokkerend**: het bevestigt onmiddellijk met `{ runId, status: "started" }` en de respons streamt via `chat`-events.
    - Chat-uploads accepteren afbeeldingen plus niet-videobestanden. Afbeeldingen behouden het native afbeeldingspad; andere bestanden worden opgeslagen als beheerde media en in de geschiedenis weergegeven als bijlagelinks.
    - Opnieuw verzenden met dezelfde `idempotencyKey` retourneert `{ status: "in_flight" }` terwijl de run actief is, en `{ status: "ok" }` na voltooiing.
    - `chat.history`-responses zijn qua grootte begrensd voor UI-veiligheid. Wanneer transcriptitems te groot zijn, kan Gateway lange tekstvelden inkorten, zware metadatablokken weglaten en te grote berichten vervangen door een placeholder (`[chat.history omitted: message too large]`).
    - Door de assistant/gegenereerde afbeeldingen worden bewaard als beheerde mediareferenties en teruggeleverd via geauthenticeerde Gateway-media-URL's, zodat herladen niet afhankelijk is van onbewerkte base64-afbeeldingspayloads die in de chatgeschiedenisrespons blijven.
    - `chat.history` verwijdert ook inline directivetags die alleen voor weergave zijn uit zichtbare assistant-tekst (bijvoorbeeld `[[reply_to_*]]` en `[[audio_as_voice]]`), tool-call-XML-payloads in platte tekst (waaronder `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en ingekorte tool-call-blokken), en gelekte ASCII-/volledige-breedte modelbesturingstokens, en laat assistant-items weg waarvan de volledige zichtbare tekst alleen het exacte stille token `NO_REPLY` / `no_reply` is.
    - Tijdens een actieve send en de laatste geschiedenisverversing houdt de chatweergave lokale optimistische gebruikers-/assistant-berichten zichtbaar als `chat.history` kort een oudere snapshot retourneert; het canonieke transcript vervangt die lokale berichten zodra de Gateway-geschiedenis is bijgewerkt.
    - Live `chat`-events zijn afleverstatus, terwijl `chat.history` opnieuw wordt opgebouwd uit het duurzame sessietranscript. Na tool-final-events herlaadt de Control UI de geschiedenis en voegt alleen een kleine optimistische staart samen; de transcriptgrens is gedocumenteerd in [WebChat](/nl/web/webchat).
    - `chat.inject` voegt een assistant-notitie toe aan het sessietranscript en broadcast een `chat`-event voor updates alleen voor de UI (geen agent-run, geen kanaalaflevering).
    - De model- en thinking-kiezers in de chatkop patchen de actieve sessie onmiddellijk via `sessions.patch`; het zijn permanente sessie-overschrijvingen, geen verzendopties voor slechts één beurt.
    - `/new` typen in de Control UI maakt dezelfde nieuwe dashboardsessie als New Chat en schakelt ernaar over. `/reset` typen behoudt de expliciete in-place reset van de Gateway voor de huidige sessie.
    - De chatmodelkiezer vraagt de geconfigureerde modelweergave van de Gateway op. Als `agents.defaults.models` aanwezig is, stuurt die allowlist de kiezer aan. Anders toont de kiezer expliciete `models.providers.*.models`-items plus providers met bruikbare auth. De volledige catalogus blijft beschikbaar via de debug-`models.list`-RPC met `view: "all"`.
    - Wanneer recente gebruiksrapporten van Gateway-sessies hoge contextdruk tonen, toont het chatcomposer-gebied een contextmelding en, bij aanbevolen compactionniveaus, een compacte knop die het normale sessiecompactionpad uitvoert. Verouderde tokensnapshots worden verborgen totdat de Gateway opnieuw recent gebruik rapporteert.

  </Accordion>
  <Accordion title="Praatmodus (browser realtime)">
    Praatmodus gebruikt een geregistreerde realtime spraakprovider. Configureer OpenAI met `talk.provider: "openai"` plus `talk.providers.openai.apiKey`, of configureer Google met `talk.provider: "google"` plus `talk.providers.google.apiKey`; de realtime providerconfiguratie van Voice Call kan nog steeds als fallback worden hergebruikt. De browser ontvangt nooit een standaard API-sleutel van de provider. OpenAI ontvangt een ephemeral Realtime-clientgeheim voor WebRTC. Google Live ontvangt een eenmalig beperkt Live API-auth-token voor een browser-WebSocket-sessie, waarbij instructies en tooldeclaraties door de Gateway in het token zijn vastgezet. Providers die alleen een backend realtime bridge aanbieden, lopen via het Gateway-relaytransport, zodat credentials en vendor-sockets server-side blijven terwijl browseraudio via geauthenticeerde Gateway-RPC's beweegt. De Realtime-sessieprompt wordt samengesteld door de Gateway; `talk.realtime.session` accepteert geen door de caller aangeleverde instructie-overschrijvingen.

    In de Chat-composer is de Talk-knop de golfknop naast de microfoonknop voor dicteren. Wanneer Talk start, toont de statusrij van de composer `Connecting Talk...`, daarna `Talk live` terwijl audio verbonden is, of `Asking OpenClaw...` terwijl een realtime tool-call het geconfigureerde grotere model raadpleegt via `chat.send`.

    Maintainer live smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifieert de OpenAI browser-WebRTC-SDP-uitwisseling, de Google Live constrained-token browser-WebSocket-setup en de Gateway-relay browseradapter met nep-microfoonmedia. De opdracht print alleen providerstatus en logt geen secrets.

  </Accordion>
  <Accordion title="Stoppen en afbreken">
    - Klik op **Stop** (roept `chat.abort` aan).
    - Terwijl een run actief is, worden normale follow-ups in de wachtrij geplaatst. Klik op **Steer** bij een bericht in de wachtrij om die follow-up in de lopende beurt te injecteren.
    - Typ `/stop` (of zelfstandige afbreekzinnen zoals `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) om out-of-band af te breken.
    - `chat.abort` ondersteunt `{ sessionKey }` (geen `runId`) om alle actieve runs voor die sessie af te breken.

  </Accordion>
  <Accordion title="Behoud van gedeeltelijke abort-output">
    - Wanneer een run wordt afgebroken, kan gedeeltelijke assistant-tekst nog steeds in de UI worden weergegeven.
    - Gateway bewaart afgebroken gedeeltelijke assistant-tekst in de transcriptgeschiedenis wanneer gebufferde output bestaat.
    - Bewaarde items bevatten abortmetadata zodat transcriptconsumenten gedeeltelijke abort-output kunnen onderscheiden van normale voltooiingsoutput.

  </Accordion>
</AccordionGroup>

## PWA-installatie en webpush

De Control UI levert een `manifest.webmanifest` en een service worker, zodat moderne browsers deze als zelfstandige PWA kunnen installeren. Web Push laat de Gateway de geïnstalleerde PWA wekken met meldingen, zelfs wanneer het tabblad of browservenster niet open is.

| Oppervlak                                             | Wat het doet                                                      |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                      | PWA-manifest. Browsers bieden "App installeren" aan zodra het bereikbaar is. |
| `ui/public/sw.js`                                     | Service worker die `push`-events en klikken op meldingen afhandelt. |
| `push/vapid-keys.json` (onder de OpenClaw-statusmap) | Automatisch gegenereerd VAPID-sleutelpaar dat wordt gebruikt om Web Push-payloads te ondertekenen. |
| `push/web-push-subscriptions.json`                    | Bewaarde browserabonnementseindpunten.                            |

Overschrijf het VAPID-sleutelpaar via env vars op het Gateway-proces wanneer je sleutels wilt vastpinnen (voor multi-host-deployments, secretrotatie of tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (standaard `mailto:openclaw@localhost`)

De Control UI gebruikt deze scope-gated Gateway-methoden om browserabonnementen te registreren en te testen:

- `push.web.vapidPublicKey` — haalt de actieve openbare VAPID-sleutel op.
- `push.web.subscribe` — registreert een `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — verwijdert een geregistreerd eindpunt.
- `push.web.test` — verzendt een testmelding naar het abonnement van de caller.

<Note>
Web Push staat los van het iOS APNS-relaypad (zie [Configuratie](/nl/gateway/configuration) voor relay-backed push) en de bestaande `push.test`-methode, die gericht zijn op native mobiele koppeling.
</Note>

## Gehoste embeds

Assistant-berichten kunnen gehoste webinhoud inline renderen met de `[embed ...]`-shortcode. Het iframe-sandboxbeleid wordt beheerd door `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Schakelt scriptuitvoering binnen gehoste embeds uit.
  </Tab>
  <Tab title="scripts (standaard)">
    Staat interactieve embeds toe terwijl origin-isolatie behouden blijft; dit is de standaard en is meestal genoeg voor zelfstandige browsergames/widgets.
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
Gebruik `trusted` alleen wanneer het ingesloten document echt same-origin-gedrag nodig heeft. Voor de meeste door agents gegenereerde games en interactieve canvassen is `scripts` de veiligere keuze.
</Warning>

Absolute externe `http(s)`-embed-URL's blijven standaard geblokkeerd. Als je bewust wilt dat `[embed url="https://..."]` pagina's van derden laadt, stel dan `gateway.controlUi.allowExternalEmbedUrls: true` in.

## Breedte van chatberichten

Gegroepeerde chatberichten gebruiken een leesbare standaard maximale breedte. Wide-monitor-deployments kunnen deze overschrijven zonder gebundelde CSS te patchen door `gateway.controlUi.chatMessageMaxWidth` in te stellen:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

De waarde wordt gevalideerd voordat deze de browser bereikt. Ondersteunde waarden zijn onder andere gewone lengtes en percentages zoals `960px` of `82%`, plus begrensde `min(...)`-, `max(...)`-, `clamp(...)`-, `calc(...)`- en `fit-content(...)`-breedte-expressies.

## Tailnet-toegang (aanbevolen)

<Tabs>
  <Tab title="Geïntegreerde Tailscale Serve (voorkeur)">
    Houd de Gateway op loopback en laat Tailscale Serve deze proxyen met HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Open:

    - `https://<magicdns>/` (of je geconfigureerde `gateway.controlUi.basePath`)

    Standaard kunnen Control UI-/WebSocket Serve-requests authenticeren via Tailscale-identiteitsheaders (`tailscale-user-login`) wanneer `gateway.auth.allowTailscale` `true` is. OpenClaw verifieert de identiteit door het `x-forwarded-for`-adres op te lossen met `tailscale whois` en dit te matchen met de header, en accepteert deze alleen wanneer de request loopback bereikt met Tailscale's `x-forwarded-*`-headers. Voor Control UI-operatorsessies met browserapparaatidentiteit slaat dit geverifieerde Serve-pad ook de device-pairing round trip over; browsers zonder apparaat en node-role-verbindingen volgen nog steeds de normale apparaatcontroles. Stel `gateway.auth.allowTailscale: false` in als je expliciete shared-secret-credentials wilt vereisen, zelfs voor Serve-verkeer. Gebruik dan `gateway.auth.mode: "token"` of `"password"`.

    Voor dat asynchrone Serve-identiteitspad worden mislukte auth-pogingen voor hetzelfde client-IP en dezelfde auth-scope geserialiseerd voordat rate-limit-writes plaatsvinden. Gelijktijdige slechte retries vanuit dezelfde browser kunnen daarom `retry later` op de tweede request tonen in plaats van twee gewone mismatches die parallel racen.

    <Warning>
    Tokenloze Serve-auth gaat ervan uit dat de gatewayhost vertrouwd is. Als niet-vertrouwde lokale code op die host kan draaien, vereis dan token-/password-auth.
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

- localhost-only onveilige HTTP-compatibiliteit met `gateway.controlUi.allowInsecureAuth=true`
- succesvolle operator-Control UI-auth via `gateway.auth.mode: "trusted-proxy"`
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

    - Hiermee kunnen localhost-Control UI-sessies doorgaan zonder apparaatidentiteit in niet-beveiligde HTTP-contexten.
    - Hiermee worden koppelingscontroles niet omzeild.
    - Hiermee worden vereisten voor apparaatidentiteit op afstand (niet-localhost) niet versoepeld.

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
    `dangerouslyDisableDeviceAuth` schakelt apparaatidentiteitscontroles voor de Control UI uit en is een ernstige beveiligingsverlaging. Draai dit snel terug na noodgebruik.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Succesvolle trusted-proxy-authenticatie kan **operator**-Control UI-sessies toelaten zonder apparaatidentiteit.
    - Dit geldt **niet** voor Control UI-sessies met noderol.
    - Same-host local loopback reverse proxies voldoen nog steeds niet aan trusted-proxy-authenticatie; zie [Trusted proxy auth](/nl/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Zie [Tailscale](/nl/gateway/tailscale) voor hulp bij het instellen van HTTPS.

## Contentbeveiligingsbeleid

De Control UI wordt geleverd met een streng `img-src`-beleid: alleen assets van **dezelfde origin**, `data:`-URL's en lokaal gegenereerde `blob:`-URL's zijn toegestaan. Externe `http(s)`- en protocolrelatieve afbeeldings-URL's worden door de browser geweigerd en leiden niet tot netwerkverzoeken.

Wat dit in de praktijk betekent:

- Avatars en afbeeldingen die via relatieve paden worden aangeboden (bijvoorbeeld `/avatars/<id>`) worden nog steeds weergegeven, inclusief geauthenticeerde avatarroutes die de UI ophaalt en omzet in lokale `blob:`-URL's.
- Inline `data:image/...`-URL's worden nog steeds weergegeven (handig voor payloads binnen het protocol).
- Lokale `blob:`-URL's die door de Control UI zijn gemaakt, worden nog steeds weergegeven.
- Externe avatar-URL's die door kanaalmetadata worden uitgegeven, worden door de avatarhelpers van de Control UI verwijderd en vervangen door het ingebouwde logo/de ingebouwde badge, zodat een gecompromitteerd of schadelijk kanaal geen willekeurige externe afbeeldingsverzoeken vanuit de browser van een operator kan afdwingen.

Je hoeft niets te wijzigen om dit gedrag te krijgen — het staat altijd aan en is niet configureerbaar.

## Authenticatie voor avatarroutes

Wanneer Gateway-authenticatie is geconfigureerd, vereist het avatarendpoint van de Control UI hetzelfde Gateway-token als de rest van de API:

- `GET /avatar/<agentId>` retourneert de avatarafbeelding alleen aan geauthenticeerde callers. `GET /avatar/<agentId>?meta=1` retourneert de avatarmetadata volgens dezelfde regel.
- Niet-geauthenticeerde verzoeken naar een van beide routes worden geweigerd (net als bij de naastliggende assistant-media-route). Dit voorkomt dat de avatarroute agentidentiteit lekt op hosts die verder beschermd zijn.
- De Control UI stuurt zelf het Gateway-token door als bearer-header bij het ophalen van avatars en gebruikt geauthenticeerde blob-URL's, zodat de afbeelding nog steeds in dashboards wordt weergegeven.

Als je Gateway-authenticatie uitschakelt (niet aanbevolen op gedeelde hosts), wordt de avatarroute ook niet-geauthenticeerd, in lijn met de rest van de Gateway.

## Authenticatie voor assistant-media-route

Wanneer Gateway-authenticatie is geconfigureerd, gebruiken lokale mediavoorvertoningen van de assistent een tweestapsroute:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` vereist de normale operator-authenticatie van de Control UI. De browser verzendt het Gateway-token als bearer-header bij het controleren van beschikbaarheid.
- Succesvolle metadatareacties bevatten een kortlevende `mediaTicket` die is beperkt tot dat exacte bronpad.
- Door de browser weergegeven URL's voor afbeeldingen, audio, video en documenten gebruiken `mediaTicket=<ticket>` in plaats van het actieve Gateway-token of wachtwoord. Het ticket verloopt snel en kan geen andere bron autoriseren.

Hierdoor blijft normale mediaweergave compatibel met browser-native media-elementen zonder herbruikbare Gateway-referenties in zichtbare media-URL's te plaatsen.

## De UI bouwen

De Gateway serveert statische bestanden uit `dist/control-ui`. Bouw ze met:

```bash
pnpm ui:build
```

Optionele absolute basis (wanneer je vaste asset-URL's wilt):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Voor lokale ontwikkeling (afzonderlijke ontwikkelserver):

```bash
pnpm ui:dev
```

Wijs de UI daarna naar je Gateway-WS-URL (bijv. `ws://127.0.0.1:18789`).

## Debuggen/testen: ontwikkelserver + externe Gateway

De Control UI bestaat uit statische bestanden; het WebSocket-doel is configureerbaar en kan verschillen van de HTTP-origin. Dit is handig wanneer je de Vite-ontwikkelserver lokaal wilt gebruiken, maar de Gateway elders draait.

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
  <Accordion title="Notes">
    - `gatewayUrl` wordt na het laden opgeslagen in localStorage en uit de URL verwijderd.
    - Als je een volledig `ws://`- of `wss://`-endpoint via `gatewayUrl` doorgeeft, URL-encodeer dan de waarde van `gatewayUrl` zodat de browser de querystring correct parseert.
    - `token` moet waar mogelijk via het URL-fragment (`#token=...`) worden doorgegeven. Fragmenten worden niet naar de server verzonden, wat lekken via verzoeklogs en Referer voorkomt. Verouderde `?token=`-queryparams worden voor compatibiliteit nog één keer geïmporteerd, maar alleen als fallback, en worden direct na bootstrap verwijderd.
    - `password` wordt alleen in het geheugen bewaard.
    - Wanneer `gatewayUrl` is ingesteld, valt de UI niet terug op configuratie- of omgevingsreferenties. Geef `token` (of `password`) expliciet op. Ontbrekende expliciete referenties zijn een fout.
    - Gebruik `wss://` wanneer de Gateway achter TLS staat (Tailscale Serve, HTTPS-proxy, enz.).
    - `gatewayUrl` wordt alleen geaccepteerd in een venster op topniveau (niet ingesloten) om clickjacking te voorkomen.
    - Niet-local loopback-Control UI-implementaties moeten `gateway.controlUi.allowedOrigins` expliciet instellen (volledige origins). Dit omvat externe ontwikkelopstellingen.
    - Het opstarten van de Gateway kan lokale origins zoals `http://localhost:<port>` en `http://127.0.0.1:<port>` vullen op basis van de effectieve runtime-bind en poort, maar externe browser-origins hebben nog steeds expliciete vermeldingen nodig.
    - Gebruik `gateway.controlUi.allowedOrigins: ["*"]` niet behalve voor strikt gecontroleerde lokale tests. Het betekent: sta elke browser-origin toe, niet "match de host die ik gebruik."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` schakelt fallbackmodus voor Host-header-origin in, maar dit is een gevaarlijke beveiligingsmodus.

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
- [Health Checks](/nl/gateway/health) — Gateway-gezondheidsmonitoring
- [TUI](/nl/web/tui) — terminalgebruikersinterface
- [WebChat](/nl/web/webchat) — browsergebaseerde chatinterface
