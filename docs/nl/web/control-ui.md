---
read_when:
    - Je wilt de Gateway vanuit een browser bedienen
    - Je wilt Tailnet-toegang zonder SSH-tunnels
sidebarTitle: Control UI
summary: Browsergebaseerde bedieningsinterface voor de Gateway (chat, knooppunten, configuratie)
title: Besturings-UI
x-i18n:
    generated_at: "2026-05-02T11:31:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: b49118ee964f9efb68479494d2bc1ba4029f0ec5c12fc69bd3975c3ea5082e14
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
- trusted-proxy-identiteitsheaders wanneer `gateway.auth.mode: "trusted-proxy"`

Het instellingenpaneel van het dashboard bewaart een token voor de huidige browsertabsessie en de geselecteerde gateway-URL; wachtwoorden worden niet bewaard. Onboarding genereert meestal bij de eerste verbinding een gateway-token voor shared-secret-auth, maar wachtwoordauth werkt ook wanneer `gateway.auth.mode` `"password"` is.

## Apparaat koppelen (eerste verbinding)

Wanneer je vanuit een nieuwe browser of vanaf een nieuw apparaat verbinding maakt met de Control UI, vereist de Gateway meestal een **eenmalige koppelingsgoedkeuring**. Dit is een beveiligingsmaatregel om ongeautoriseerde toegang te voorkomen.

**Wat je ziet:** "disconnected (1008): pairing required"

<Steps>
  <Step title="Openstaande aanvragen tonen">
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

Als de browser opnieuw probeert te koppelen met gewijzigde auth-gegevens (rol/scopes/openbare sleutel), wordt de vorige openstaande aanvraag vervangen en wordt een nieuwe `requestId` aangemaakt. Voer `openclaw devices list` opnieuw uit vóór goedkeuring.

Als de browser al gekoppeld is en je deze wijzigt van leestoegang naar schrijf-/admintoegang, wordt dit behandeld als een goedkeuringsupgrade, niet als een stille herverbinding. OpenClaw houdt de oude goedkeuring actief, blokkeert de bredere herverbinding en vraagt je om de nieuwe set scopes expliciet goed te keuren.

Na goedkeuring wordt het apparaat onthouden en is geen nieuwe goedkeuring vereist, tenzij je het intrekt met `openclaw devices revoke --device <id> --role <role>`. Zie [Devices CLI](/nl/cli/devices) voor tokenrotatie en intrekking.

<Note>
- Rechtstreekse local loopback-browserverbindingen (`127.0.0.1` / `localhost`) worden automatisch goedgekeurd.
- Tailscale Serve kan de koppelingsronde overslaan voor Control UI-operatorsessies wanneer `gateway.auth.allowTailscale: true`, de Tailscale-identiteit wordt geverifieerd en de browser zijn apparaatidentiteit presenteert.
- Rechtstreekse Tailnet-binds, LAN-browserverbindingen en browserprofielen zonder apparaatidentiteit vereisen nog steeds expliciete goedkeuring.
- Elk browserprofiel genereert een uniek apparaat-ID, dus het wisselen van browser of het wissen van browsergegevens vereist opnieuw koppelen.

</Note>

## Persoonlijke identiteit (browserlokaal)

De Control UI ondersteunt een persoonlijke identiteit per browser (weergavenaam en avatar) die aan uitgaande berichten wordt gekoppeld voor attributie in gedeelde sessies. Deze staat in browseropslag, is beperkt tot het huidige browserprofiel en wordt niet gesynchroniseerd naar andere apparaten of server-side bewaard buiten de normale transcript-auteurschapsmetadata van berichten die je daadwerkelijk verstuurt. Sitegegevens wissen of van browser wisselen zet deze terug naar leeg.

Hetzelfde browserlokale patroon geldt voor de overschrijving van de assistentavatar. Geüploade assistentavatars leggen alleen in de lokale browser een laag over de door de gateway opgeloste identiteit en gaan nooit heen en weer via `config.patch`. Het gedeelde configuratieveld `ui.assistant.avatar` blijft beschikbaar voor niet-UI-clients die het veld rechtstreeks schrijven (zoals gescripte gateways of aangepaste dashboards).

## Runtime-configuratie-eindpunt

De Control UI haalt zijn runtime-instellingen op via `/__openclaw/control-ui-config.json`. Dat eindpunt wordt afgeschermd door dezelfde gateway-auth als de rest van het HTTP-oppervlak: niet-geauthenticeerde browsers kunnen het niet ophalen, en een geslaagde fetch vereist ofwel een al geldig gateway-token/wachtwoord, Tailscale Serve-identiteit of een trusted-proxy-identiteit.

## Taalondersteuning

De Control UI kan zichzelf bij de eerste laadactie lokaliseren op basis van je browserlocale. Om dit later te overschrijven, open je **Overzicht -> Gateway-toegang -> Taal**. De locale-kiezer staat in de Gateway-toegangskaart, niet onder Weergave.

- Ondersteunde locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Niet-Engelse vertalingen worden lazy-loaded in de browser.
- De geselecteerde locale wordt opgeslagen in browseropslag en hergebruikt bij toekomstige bezoeken.
- Ontbrekende vertaalsleutels vallen terug op Engels.

Docs-vertalingen worden gegenereerd voor dezelfde niet-Engelse localeset, maar de ingebouwde Mintlify-taalkiezer van de docs-site is beperkt tot de locale-codes die Mintlify accepteert. Thaise (`th`) en Perzische (`fa`) docs worden nog steeds gegenereerd in de publicatierepo; ze verschijnen mogelijk pas in die kiezer zodra Mintlify deze codes ondersteunt.

## Weergavethema's

Het Weergavepaneel behoudt de ingebouwde Claw-, Knot- en Dash-thema's, plus één browserlokale tweakcn-importslot. Om een thema te importeren, open je [tweakcn themes](https://tweakcn.com/themes), kies of maak je een thema, klik je op **Delen** en plak je de gekopieerde themalink in Weergave. De importer accepteert ook `https://tweakcn.com/r/themes/<id>`-register-URL's, editor-URL's zoals `https://tweakcn.com/editor/theme?theme=amethyst-haze`, relatieve `/themes/<id>`-paden, ruwe thema-ID's en standaardthemanamen zoals `amethyst-haze`.

Geïmporteerde thema's worden alleen in het huidige browserprofiel opgeslagen. Ze worden niet naar de gateway-configuratie geschreven en synchroniseren niet tussen apparaten. Het vervangen van het geïmporteerde thema werkt het ene lokale slot bij; het wissen ervan schakelt het actieve thema terug naar Claw als het geïmporteerde thema was geselecteerd.

## Wat het kan doen (vandaag)

<AccordionGroup>
  <Accordion title="Chat en Talk">
    - Chat met het model via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Praat via realtime browsersessies. OpenAI gebruikt directe WebRTC, Google Live gebruikt een beperkte eenmalige browsertoken via WebSocket, en backend-only realtime spraakplugins gebruiken het Gateway-relaytransport. De relay houdt providerreferenties op de Gateway terwijl de browser microfoon-PCM streamt via `talk.realtime.relay*`-RPC's en `openclaw_agent_consult`-toolcalls terugstuurt via `chat.send` voor het grotere geconfigureerde OpenClaw-model.
    - Stream toolcalls + live tooluitvoerkaarten in Chat (agentgebeurtenissen).

  </Accordion>
  <Accordion title="Kanalen, instanties, sessies, dromen">
    - Kanalen: ingebouwde plus gebundelde/externe pluginkanaalstatus, QR-login en configuratie per kanaal (`channels.status`, `web.login.*`, `config.patch`).
    - Instanties: aanwezigheidslijst + vernieuwen (`system-presence`).
    - Sessies: lijst + model-/thinking-/fast-/verbose-/trace-/reasoning-overschrijvingen per sessie (`sessions.list`, `sessions.patch`).
    - Dromen: Dreaming-status, schakelaar voor inschakelen/uitschakelen en Dream Diary-lezer (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, Nodes, exec-goedkeuringen">
    - Cron-taken: tonen/toevoegen/bewerken/uitvoeren/inschakelen/uitschakelen + uitvoeringsgeschiedenis (`cron.*`).
    - Skills: status, inschakelen/uitschakelen, installeren, API-sleutelupdates (`skills.*`).
    - Nodes: lijst + caps (`node.list`).
    - Exec-goedkeuringen: allowlists voor gateway of Node bewerken + vraagbeleid voor `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuratie">
    - Bekijk/bewerk `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Pas toe + herstart met validatie (`config.apply`) en wek de laatst actieve sessie.
    - Schrijfacties bevatten een base-hash-beveiliging om het overschrijven van gelijktijdige bewerkingen te voorkomen.
    - Schrijfacties (`config.set`/`config.apply`/`config.patch`) voeren vooraf een actieve SecretRef-resolutie uit voor refs in de ingediende configuratiepayload; niet-opgeloste actieve ingediende refs worden vóór het schrijven geweigerd.
    - Schema + formulierweergave (`config.schema` / `config.schema.lookup`, inclusief veld `title` / `description`, overeenkomende UI-hints, directe samenvattingen van children, docs-metadata op geneste object-/wildcard-/array-/composition-nodes, plus plugin- en kanaalschema's wanneer beschikbaar); Raw JSON-editor is alleen beschikbaar wanneer de snapshot een veilige ruwe round-trip heeft.
    - Als een snapshot ruwe tekst niet veilig kan round-trippen, forceert Control UI de formuliermodus en schakelt Raw-modus voor die snapshot uit.
    - Raw JSON-editor "Reset to saved" behoudt de raw-authored-vorm (opmaak, opmerkingen, `$include`-layout) in plaats van een afgevlakte snapshot opnieuw te renderen, zodat externe bewerkingen een reset overleven wanneer de snapshot veilig kan round-trippen.
    - Gestructureerde SecretRef-objectwaarden worden alleen-lezen weergegeven in tekstinvoer van formulieren om onbedoelde object-naar-string-corruptie te voorkomen.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debug: status-/health-/modelssnapshots + gebeurtenislog + handmatige RPC-calls (`status`, `health`, `models.list`).
    - Logs: live tail van gateway-bestandslogs met filter/export (`logs.tail`).
    - Update: voer een package-/git-update + herstart uit (`update.run`) met een herstartrapport, en poll daarna `update.status` na herverbinding om de draaiende gatewayversie te verifiëren.

  </Accordion>
  <Accordion title="Opmerkingen bij Cron-takenpaneel">
    - Voor geïsoleerde taken is de standaardlevering aankondigingssamenvatting. Je kunt overschakelen naar geen als je alleen interne uitvoeringen wilt.
    - Kanaal-/doelvelden verschijnen wanneer aankondiging is geselecteerd.
    - Webhook-modus gebruikt `delivery.mode = "webhook"` met `delivery.to` ingesteld op een geldige HTTP(S)-webhook-URL.
    - Voor hoofdsessietaken zijn de leveringsmodi Webhook en geen beschikbaar.
    - Geavanceerde bewerkingsopties omvatten verwijderen-na-uitvoering, agentoverschrijving wissen, exacte/stagger-opties voor Cron, agentmodel-/thinking-overschrijvingen en best-effort-leveringsschakelaars.
    - Formuliervalidatie is inline met veldspecifieke fouten; ongeldige waarden schakelen de knop Opslaan uit totdat ze zijn opgelost.
    - Stel `cron.webhookToken` in om een specifieke bearer-token te verzenden; indien weggelaten wordt de Webhook zonder auth-header verzonden.
    - Verouderde fallback: opgeslagen legacy-taken met `notify: true` kunnen nog steeds `cron.webhook` gebruiken totdat ze zijn gemigreerd.

  </Accordion>
</AccordionGroup>

## Chatgedrag

<AccordionGroup>
  <Accordion title="Semantiek van verzenden en geschiedenis">
    - `chat.send` is **niet-blokkerend**: het bevestigt direct met `{ runId, status: "started" }` en de reactie streamt via `chat`-gebeurtenissen.
    - Chatuploads accepteren afbeeldingen plus niet-videobestanden. Afbeeldingen behouden het native afbeeldingspad; andere bestanden worden opgeslagen als beheerde media en in de geschiedenis weergegeven als bijlagelinks.
    - Opnieuw verzenden met dezelfde `idempotencyKey` retourneert `{ status: "in_flight" }` terwijl de uitvoering loopt, en `{ status: "ok" }` na voltooiing.
    - `chat.history`-reacties zijn in grootte begrensd voor UI-veiligheid. Wanneer transcriptvermeldingen te groot zijn, kan Gateway lange tekstvelden afkappen, zware metadatablokken weglaten en te grote berichten vervangen door een placeholder (`[chat.history omitted: message too large]`).
    - Door de assistent gegenereerde afbeeldingen worden vastgelegd als beheerde mediareferenties en teruggeleverd via geauthenticeerde Gateway-media-URL's, zodat herladen niet afhankelijk is van onbewerkte base64-afbeeldingspayloads die in de chatgeschiedenisreactie blijven staan.
    - `chat.history` verwijdert ook alleen-voor-weergave inline richtlijntags uit zichtbare assistenttekst (bijvoorbeeld `[[reply_to_*]]` en `[[audio_as_voice]]`), plattetekst-XML-payloads voor toolaanroepen (waaronder `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en afgekorte toolaanroepblokken), en gelekte ASCII-/full-width-modelcontroletokens, en laat assistentvermeldingen weg waarvan de hele zichtbare tekst alleen exact het stille token `NO_REPLY` / `no_reply` is.
    - Tijdens een actieve verzending en de laatste vernieuwing van de geschiedenis houdt de chatweergave lokale optimistische gebruikers-/assistentberichten zichtbaar als `chat.history` kort een oudere snapshot retourneert; het canonieke transcript vervangt die lokale berichten zodra de Gateway-geschiedenis is bijgewerkt.
    - `chat.inject` voegt een assistentnotitie toe aan het sessietranscript en zendt een `chat`-gebeurtenis uit voor alleen-UI-updates (geen agentuitvoering, geen kanaallevering).
    - De model- en denkkeuzelijsten in de chatkop patchen de actieve sessie direct via `sessions.patch`; het zijn permanente sessie-overschrijvingen, geen verzendopties voor slechts één beurt.
    - Het typen van `/new` in de Control UI maakt dezelfde nieuwe dashboardsessie als New Chat aan en schakelt ernaar over. Het typen van `/reset` behoudt de expliciete in-place reset van de Gateway voor de huidige sessie.
    - De chatmodelkiezer vraagt de geconfigureerde modelweergave van de Gateway op. Als `agents.defaults.models` aanwezig is, stuurt die allowlist de kiezer aan. Anders toont de kiezer expliciete `models.providers.*.models`-vermeldingen plus providers met bruikbare authenticatie. De volledige catalogus blijft beschikbaar via de debug-`models.list`-RPC met `view: "all"`.
    - Wanneer nieuwe gebruiksrapporten van Gateway-sessies hoge contextdruk tonen, geeft het chatcomposergebied een contextmelding weer en, bij aanbevolen compaction-niveaus, een compacte knop die het normale pad voor sessie-compaction uitvoert. Verouderde tokensnapshots worden verborgen totdat de Gateway opnieuw vers gebruik rapporteert.

  </Accordion>
  <Accordion title="Praatmodus (browser realtime)">
    De praatmodus gebruikt een geregistreerde realtime spraakprovider. Configureer OpenAI met `talk.provider: "openai"` plus `talk.providers.openai.apiKey`, of configureer Google met `talk.provider: "google"` plus `talk.providers.google.apiKey`; de realtime providerconfiguratie van Voice Call kan nog steeds als fallback worden hergebruikt. De browser ontvangt nooit een standaard provider-API-sleutel. OpenAI ontvangt een vluchtig Realtime-clientgeheim voor WebRTC. Google Live ontvangt een eenmalig, beperkt Live API-authenticatietoken voor een browser-WebSocket-sessie, waarbij instructies en tooldeclaraties door de Gateway in het token zijn vergrendeld. Providers die alleen een backend realtime bridge aanbieden, lopen via het Gateway-relaytransport, zodat referenties en providersockets server-side blijven terwijl browseraudio via geauthenticeerde Gateway-RPC's beweegt. De Realtime-sessieprompt wordt samengesteld door de Gateway; `talk.realtime.session` accepteert geen door de aanroeper aangeleverde instructieoverschrijvingen.

    In de Chat-composer is de Talk-bediening de golfknop naast de microfoondictaatknop. Wanneer Talk start, toont de composer-statusrij `Connecting Talk...`, daarna `Talk live` terwijl audio is verbonden, of `Asking OpenClaw...` terwijl een realtime toolaanroep het geconfigureerde grotere model via `chat.send` raadpleegt.

    Maintainer live smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifieert de OpenAI browser-WebRTC SDP-uitwisseling, de Google Live browser-WebSocket-installatie met beperkt token en de Gateway-relaybrowseradapter met nep-microfoonmedia. De opdracht drukt alleen providerstatus af en logt geen geheimen.

  </Accordion>
  <Accordion title="Stoppen en afbreken">
    - Klik op **Stop** (roept `chat.abort` aan).
    - Terwijl een uitvoering actief is, worden normale vervolgberichten in de wachtrij geplaatst. Klik op **Steer** bij een bericht in de wachtrij om dat vervolgbericht in de lopende beurt te injecteren.
    - Typ `/stop` (of losse afbreekzinnen zoals `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) om buiten de band af te breken.
    - `chat.abort` ondersteunt `{ sessionKey }` (geen `runId`) om alle actieve uitvoeringen voor die sessie af te breken.

  </Accordion>
  <Accordion title="Bewaren van afgebroken gedeeltelijke uitvoer">
    - Wanneer een uitvoering wordt afgebroken, kan gedeeltelijke assistenttekst nog steeds in de UI worden getoond.
    - Gateway bewaart afgebroken gedeeltelijke assistenttekst in de transcriptgeschiedenis wanneer gebufferde uitvoer bestaat.
    - Bewaarde vermeldingen bevatten afbreekmetadata zodat transcriptconsumenten gedeeltelijke afbreekuitvoer kunnen onderscheiden van normale voltooiingsuitvoer.

  </Accordion>
</AccordionGroup>

## PWA-installatie en Web Push

De Control UI levert een `manifest.webmanifest` en een service worker, zodat moderne browsers deze als zelfstandige PWA kunnen installeren. Met Web Push kan de Gateway de geïnstalleerde PWA wekken met meldingen, zelfs wanneer het tabblad of browservenster niet open is.

| Oppervlak                                             | Wat het doet                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA-manifest. Browsers bieden "App installeren" aan zodra dit bereikbaar is. |
| `ui/public/sw.js`                                     | Service worker die `push`-gebeurtenissen en meldingsklikken afhandelt. |
| `push/vapid-keys.json` (onder de OpenClaw-statusmap) | Automatisch gegenereerd VAPID-sleutelpaar dat wordt gebruikt om Web Push-payloads te ondertekenen. |
| `push/web-push-subscriptions.json`                    | Vastgelegde browserabonnementseindpunten.                          |

Overschrijf het VAPID-sleutelpaar via omgevingsvariabelen op het Gateway-proces wanneer je sleutels wilt vastpinnen (voor multi-host-implementaties, geheimrotatie of tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (standaard `mailto:openclaw@localhost`)

De Control UI gebruikt deze door scope afgeschermde Gateway-methoden om browserabonnementen te registreren en te testen:

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
    Staat interactieve embeds toe terwijl origin-isolatie behouden blijft; dit is de standaardinstelling en is meestal genoeg voor zelfstandige browsergames/widgets.
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

Absolute externe `http(s)` embed-URL's blijven standaard geblokkeerd. Als je bewust wilt dat `[embed url="https://..."]` pagina's van derden laadt, stel dan `gateway.controlUi.allowExternalEmbedUrls: true` in.

## Tailnet-toegang (aanbevolen)

<Tabs>
  <Tab title="Geïntegreerde Tailscale Serve (voorkeur)">
    Houd de Gateway op loopback en laat Tailscale Serve deze proxyen met HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Open:

    - `https://<magicdns>/` (of je geconfigureerde `gateway.controlUi.basePath`)

    Standaard kunnen Control UI-/WebSocket Serve-aanvragen authenticeren via Tailscale-identiteitsheaders (`tailscale-user-login`) wanneer `gateway.auth.allowTailscale` `true` is. OpenClaw verifieert de identiteit door het adres `x-forwarded-for` met `tailscale whois` op te lossen en dit met de header te matchen, en accepteert deze alleen wanneer de aanvraag loopback raakt met Tailscale's `x-forwarded-*`-headers. Voor Control UI-operatorsessies met browserapparaatidentiteit slaat dit geverifieerde Serve-pad ook de device-pairing-roundtrip over; apparaatloze browsers en node-role-verbindingen volgen nog steeds de normale apparaatcontroles. Stel `gateway.auth.allowTailscale: false` in als je expliciete shared-secret-referenties wilt vereisen, zelfs voor Serve-verkeer. Gebruik daarna `gateway.auth.mode: "token"` of `"password"`.

    Voor dat asynchrone Serve-identiteitspad worden mislukte authenticatiepogingen voor hetzelfde client-IP en dezelfde authenticatiescope geserialiseerd voordat rate-limit-schrijfbewerkingen plaatsvinden. Gelijktijdige slechte nieuwe pogingen vanuit dezelfde browser kunnen daarom `retry later` tonen bij de tweede aanvraag in plaats van twee gewone mismatches die parallel racen.

    <Warning>
    Tokenloze Serve-authenticatie veronderstelt dat de gatewayhost wordt vertrouwd. Als niet-vertrouwde lokale code op die host kan draaien, vereis dan token-/wachtwoordauthenticatie.
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

- localhost-only onveilige-HTTP-compatibiliteit met `gateway.controlUi.allowInsecureAuth=true`
- geslaagde operator-Control UI-authenticatie via `gateway.auth.mode: "trusted-proxy"`
- noodoptie `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Aanbevolen oplossing:** gebruik HTTPS (Tailscale Serve) of open de UI lokaal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (op de gatewayhost)

<AccordionGroup>
  <Accordion title="Gedrag van onveilige-authenticatieschakelaar">
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

    - Deze staat localhost-Control UI-sessies toe om zonder apparaatidentiteit door te gaan in niet-veilige HTTP-contexten.
    - Deze omzeilt koppelingscontroles niet.
    - Deze versoepelt de apparaatidentiteitsvereisten voor externe (niet-localhost) verbindingen niet.

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
    `dangerouslyDisableDeviceAuth` schakelt identiteitscontroles voor Control UI-apparaten uit en is een ernstige beveiligingsverlaging. Draai dit snel terug na noodgebruik.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Geslaagde trusted-proxy-authenticatie kan **operator** Control UI-sessies toelaten zonder apparaatidentiteit.
    - Dit geldt **niet** voor Control UI-sessies met node-rol.
    - Reverse proxies via loopback op dezelfde host voldoen nog steeds niet aan trusted-proxy-authenticatie; zie [Trusted proxy auth](/nl/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Zie [Tailscale](/nl/gateway/tailscale) voor richtlijnen voor HTTPS-configuratie.

## Contentbeveiligingsbeleid

De Control UI wordt geleverd met een strikt `img-src`-beleid: alleen assets van **dezelfde origin**, `data:`-URL's en lokaal gegenereerde `blob:`-URL's zijn toegestaan. Externe `http(s)`- en protocol-relatieve afbeeldings-URL's worden door de browser geweigerd en veroorzaken geen netwerkverzoeken.

Wat dit in de praktijk betekent:

- Avatars en afbeeldingen die via relatieve paden worden aangeboden (bijvoorbeeld `/avatars/<id>`) worden nog steeds weergegeven, inclusief geauthenticeerde avatarroutes die de UI ophaalt en omzet naar lokale `blob:`-URL's.
- Inline `data:image/...`-URL's worden nog steeds weergegeven (handig voor payloads binnen het protocol).
- Lokale `blob:`-URL's die door de Control UI zijn gemaakt, worden nog steeds weergegeven.
- Externe avatar-URL's die door kanaalmetadata worden uitgegeven, worden bij de avatarhelpers van de Control UI verwijderd en vervangen door het ingebouwde logo/de ingebouwde badge, zodat een gecompromitteerd of kwaadaardig kanaal geen willekeurige externe afbeeldingsverzoeken vanuit de browser van een operator kan afdwingen.

Je hoeft niets te wijzigen om dit gedrag te krijgen — het staat altijd aan en is niet configureerbaar.

## Authenticatie voor avatarroute

Wanneer Gateway-authenticatie is geconfigureerd, vereist het avatarendpoint van de Control UI dezelfde Gateway-token als de rest van de API:

- `GET /avatar/<agentId>` retourneert de avatarafbeelding alleen aan geauthenticeerde aanroepers. `GET /avatar/<agentId>?meta=1` retourneert de avatarmetadata volgens dezelfde regel.
- Niet-geauthenticeerde verzoeken naar beide routes worden geweigerd (net als bij de naastliggende assistant-media-route). Dit voorkomt dat de avatarroute agentidentiteit lekt op hosts die verder beschermd zijn.
- De Control UI stuurt zelf de Gateway-token door als bearer-header bij het ophalen van avatars en gebruikt geauthenticeerde blob-URL's zodat de afbeelding nog steeds in dashboards wordt weergegeven.

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

Voor lokale ontwikkeling (aparte dev-server):

```bash
pnpm ui:dev
```

Wijs de UI daarna naar je Gateway WS-URL (bijv. `ws://127.0.0.1:18789`).

## Debuggen/testen: dev-server + externe Gateway

De Control UI bestaat uit statische bestanden; het WebSocket-doel is configureerbaar en kan verschillen van de HTTP-origin. Dit is handig wanneer je de Vite-dev-server lokaal wilt gebruiken, maar de Gateway ergens anders draait.

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
    - `token` moet waar mogelijk via het URL-fragment (`#token=...`) worden doorgegeven. Fragmenten worden niet naar de server verzonden, waardoor lekken via requestlogs en Referer wordt voorkomen. Verouderde `?token=`-queryparameters worden voor compatibiliteit nog één keer geïmporteerd, maar alleen als fallback, en worden direct na bootstrap verwijderd.
    - `password` wordt alleen in het geheugen bewaard.
    - Wanneer `gatewayUrl` is ingesteld, valt de UI niet terug op configuratie- of omgevingscredentials. Geef `token` (of `password`) expliciet op. Ontbrekende expliciete credentials is een fout.
    - Gebruik `wss://` wanneer de Gateway achter TLS staat (Tailscale Serve, HTTPS-proxy, enz.).
    - `gatewayUrl` wordt alleen geaccepteerd in een venster op topniveau (niet ingesloten) om clickjacking te voorkomen.
    - Niet-loopback Control UI-implementaties moeten `gateway.controlUi.allowedOrigins` expliciet instellen (volledige origins). Dit omvat externe dev-setups.
    - Bij het opstarten van de Gateway kunnen lokale origins zoals `http://localhost:<port>` en `http://127.0.0.1:<port>` worden gezaaid op basis van de effectieve runtime-bind en poort, maar externe browser-origins hebben nog steeds expliciete vermeldingen nodig.
    - Gebruik `gateway.controlUi.allowedOrigins: ["*"]` niet, behalve voor strikt gecontroleerde lokale tests. Het betekent dat elke browser-origin wordt toegestaan, niet "match de host die ik gebruik."
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

Details voor externe-toegangsconfiguratie: [Externe toegang](/nl/gateway/remote).

## Gerelateerd

- [Dashboard](/nl/web/dashboard) — Gateway-dashboard
- [Health Checks](/nl/gateway/health) — Gateway-healthmonitoring
- [TUI](/nl/web/tui) — terminalgebruikersinterface
- [WebChat](/nl/web/webchat) — browsergebaseerde chatinterface
