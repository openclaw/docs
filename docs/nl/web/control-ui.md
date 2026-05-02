---
read_when:
    - Je wilt de Gateway vanuit een browser bedienen
    - Je wilt Tailnet-toegang zonder SSH-tunnels
sidebarTitle: Control UI
summary: Browsergebaseerde bedienings-UI voor de Gateway (chat, knooppunten, configuratie)
title: Bedieningsinterface
x-i18n:
    generated_at: "2026-05-02T20:59:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 88959ccf435b31015039bf28c3043023d99f0b953a1489986ab2d0cbd261771c
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

Het instellingenpaneel van het dashboard bewaart een token voor de huidige browsertabsessie en de geselecteerde gateway-URL; wachtwoorden worden niet bewaard. Onboarding genereert meestal bij de eerste verbinding een gateway-token voor shared-secret-auth, maar wachtwoord-auth werkt ook wanneer `gateway.auth.mode` `"password"` is.

## Apparaat koppelen (eerste verbinding)

Wanneer je vanaf een nieuwe browser of nieuw apparaat verbinding maakt met de Control UI, vereist de Gateway meestal een **eenmalige koppelingsgoedkeuring**. Dit is een beveiligingsmaatregel om ongeautoriseerde toegang te voorkomen.

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

Als de browser opnieuw probeert te koppelen met gewijzigde auth-gegevens (rol/scopes/openbare sleutel), wordt het vorige openstaande verzoek vervangen en wordt een nieuwe `requestId` aangemaakt. Voer vóór goedkeuring opnieuw `openclaw devices list` uit.

Als de browser al is gekoppeld en je deze wijzigt van leestoegang naar schrijf-/beheertoegang, wordt dit behandeld als een goedkeuringsupgrade, niet als een stille herverbinding. OpenClaw houdt de oude goedkeuring actief, blokkeert de bredere herverbinding en vraagt je om de nieuwe set scopes expliciet goed te keuren.

Na goedkeuring wordt het apparaat onthouden en is er geen nieuwe goedkeuring nodig, tenzij je het intrekt met `openclaw devices revoke --device <id> --role <role>`. Zie [Devices CLI](/nl/cli/devices) voor tokenrotatie en intrekking.

<Note>
- Directe local loopback-browserverbindingen (`127.0.0.1` / `localhost`) worden automatisch goedgekeurd.
- Tailscale Serve kan de koppelingsronde overslaan voor Control UI-operatorsessies wanneer `gateway.auth.allowTailscale: true`, de Tailscale-identiteit is geverifieerd en de browser zijn apparaatidentiteit presenteert.
- Directe Tailnet-binds, LAN-browserverbindingen en browserprofielen zonder apparaatidentiteit vereisen nog steeds expliciete goedkeuring.
- Elk browserprofiel genereert een unieke apparaat-ID, dus wisselen van browser of het wissen van browsergegevens vereist opnieuw koppelen.

</Note>

## Persoonlijke identiteit (browser-lokaal)

De Control UI ondersteunt een persoonlijke identiteit per browser (weergavenaam en avatar) die wordt gekoppeld aan uitgaande berichten voor toeschrijving in gedeelde sessies. Deze leeft in browseropslag, is beperkt tot het huidige browserprofiel en wordt niet gesynchroniseerd naar andere apparaten of server-side bewaard buiten de normale metadata voor auteurschap van transcriptberichten die je daadwerkelijk verzendt. Het wissen van sitegegevens of wisselen van browser zet deze terug naar leeg.

Hetzelfde browser-lokale patroon geldt voor de override van de assistentavatar. Geüploade assistentavatars leggen de door de gateway opgeloste identiteit alleen over de lokale browser heen en gaan nooit via `config.patch` heen en terug. Het gedeelde configuratieveld `ui.assistant.avatar` blijft beschikbaar voor niet-UI-clients die het veld rechtstreeks schrijven (zoals scripted gateways of aangepaste dashboards).

## Runtime-configuratie-eindpunt

De Control UI haalt zijn runtime-instellingen op uit `/__openclaw/control-ui-config.json`. Dat eindpunt wordt beschermd door dezelfde gateway-auth als de rest van het HTTP-oppervlak: niet-geauthenticeerde browsers kunnen het niet ophalen, en een succesvolle fetch vereist een al geldig gateway-token/wachtwoord, Tailscale Serve-identiteit of een trusted-proxy-identiteit.

## Taalondersteuning

De Control UI kan zichzelf bij de eerste laadbeurt lokaliseren op basis van je browserlocale. Om dit later te overschrijven, open je **Overview -> Gateway Access -> Language**. De locale-kiezer staat in de Gateway Access-kaart, niet onder Appearance.

- Ondersteunde locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Niet-Engelse vertalingen worden lazy-loaded in de browser.
- De geselecteerde locale wordt opgeslagen in browseropslag en opnieuw gebruikt bij toekomstige bezoeken.
- Ontbrekende vertaalsleutels vallen terug op Engels.

Documentatievertalingen worden gegenereerd voor dezelfde niet-Engelse localeset, maar de ingebouwde Mintlify-taalkiezer van de documentatiesite is beperkt tot de localecodes die Mintlify accepteert. Thaise (`th`) en Perzische (`fa`) documentatie wordt nog steeds gegenereerd in de publicatierepo; deze verschijnt mogelijk pas in die kiezer wanneer Mintlify die codes ondersteunt.

## Weergavethema's

Het Appearance-paneel behoudt de ingebouwde thema's Claw, Knot en Dash, plus één browser-lokaal tweakcn-importslot. Om een thema te importeren, open je [tweakcn themes](https://tweakcn.com/themes), kies of maak je een thema, klik je op **Share** en plak je de gekopieerde themalink in Appearance. De importer accepteert ook `https://tweakcn.com/r/themes/<id>`-registry-URL's, editor-URL's zoals `https://tweakcn.com/editor/theme?theme=amethyst-haze`, relatieve `/themes/<id>`-paden, ruwe thema-ID's en standaardthemanamen zoals `amethyst-haze`.

Geïmporteerde thema's worden alleen opgeslagen in het huidige browserprofiel. Ze worden niet naar gateway-configuratie geschreven en synchroniseren niet tussen apparaten. Het vervangen van het geïmporteerde thema werkt het ene lokale slot bij; het wissen ervan schakelt het actieve thema terug naar Claw als het geïmporteerde thema was geselecteerd.

## Wat het kan doen (vandaag)

<AccordionGroup>
  <Accordion title="Chatten en praten">
    - Chat met het model via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Praat via realtime browsersessies. OpenAI gebruikt directe WebRTC, Google Live gebruikt een beperkt eenmalig browsertoken via WebSocket, en backend-only realtime spraakplugins gebruiken het Gateway-relaytransport. De relay houdt providerreferenties op de Gateway terwijl de browser microfoon-PCM streamt via `talk.realtime.relay*`-RPC's en `openclaw_agent_consult`-toolaanroepen terugstuurt via `chat.send` voor het grotere geconfigureerde OpenClaw-model.
    - Stream toolaanroepen + live tooluitvoerkaarten in Chat (agent-events).

  </Accordion>
  <Accordion title="Kanalen, instanties, sessies, dromen">
    - Kanalen: status van ingebouwde plus gebundelde/externe pluginkanalen, QR-login en configuratie per kanaal (`channels.status`, `web.login.*`, `config.patch`).
    - Instanties: aanwezigheidslijst + vernieuwen (`system-presence`).
    - Sessies: lijst + overrides per sessie voor model/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`).
    - Dromen: dreaming-status, in-/uitschakelschakelaar en Dream Diary-lezer (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, nodes, exec-goedkeuringen">
    - Cron-taken: weergeven/toevoegen/bewerken/uitvoeren/inschakelen/uitschakelen + uitvoergeschiedenis (`cron.*`).
    - Skills: status, inschakelen/uitschakelen, installeren, API-sleutelupdates (`skills.*`).
    - Nodes: lijst + caps (`node.list`).
    - Exec-goedkeuringen: allowlists voor gateway of node bewerken + vraagbeleid voor `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuratie">
    - Bekijk/bewerk `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Toepassen + herstarten met validatie (`config.apply`) en de laatst actieve sessie wekken.
    - Schrijfbewerkingen bevatten een base-hash-bescherming om te voorkomen dat gelijktijdige bewerkingen worden overschreven.
    - Schrijfbewerkingen (`config.set`/`config.apply`/`config.patch`) voeren vooraf actieve SecretRef-resolutie uit voor refs in de ingediende configuratiepayload; niet-opgeloste actieve ingediende refs worden vóór het schrijven geweigerd.
    - Schema + formulierweergave (`config.schema` / `config.schema.lookup`, inclusief veld `title` / `description`, gematchte UI-hints, samenvattingen van directe children, documentatiemetadata op geneste object-/wildcard-/array-/composition-nodes, plus plugin- en kanaalschema's wanneer beschikbaar); de Raw JSON-editor is alleen beschikbaar wanneer de snapshot een veilige raw round-trip heeft.
    - Als een snapshot raw tekst niet veilig heen en terug kan verwerken, dwingt Control UI Form-modus af en schakelt Raw-modus uit voor die snapshot.
    - Raw JSON-editor "Reset to saved" behoudt de raw-auteursvorm (opmaak, comments, `$include`-layout) in plaats van een afgevlakte snapshot opnieuw te renderen, zodat externe bewerkingen een reset overleven wanneer de snapshot veilig heen en terug kan.
    - Gestructureerde SecretRef-objectwaarden worden read-only weergegeven in tekstinvoer van formulieren om onbedoelde corruptie van object naar string te voorkomen.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debug: snapshots van status/health/models + eventlog + handmatige RPC-aanroepen (`status`, `health`, `models.list`).
    - Logs: live tail van gateway-bestandslogs met filter/export (`logs.tail`).
    - Update: voer een package-/git-update + herstart uit (`update.run`) met een herstartrapport en poll daarna `update.status` na herverbinding om de draaiende gateway-versie te verifiëren.

  </Accordion>
  <Accordion title="Notities bij het Cron-takenpaneel">
    - Voor geïsoleerde taken is bezorging standaard ingesteld op samenvatting aankondigen. Je kunt overschakelen naar geen als je alleen interne runs wilt.
    - Kanaal-/doelvelden verschijnen wanneer aankondigen is geselecteerd.
    - Webhook-modus gebruikt `delivery.mode = "webhook"` met `delivery.to` ingesteld op een geldige HTTP(S)-webhook-URL.
    - Voor hoofdsessietaken zijn webhook- en geen-bezorgmodi beschikbaar.
    - Geavanceerde bewerkingsbediening bevat verwijderen-na-run, agent-override wissen, exacte/gespreide cron-opties, overrides voor agentmodel/thinking en best-effort-bezorgschakelaars.
    - Formuliervalidatie is inline met fouten op veldniveau; ongeldige waarden schakelen de opslagknop uit totdat ze zijn opgelost.
    - Stel `cron.webhookToken` in om een dedicated bearer-token te verzenden; als dit wordt weggelaten, wordt de webhook zonder auth-header verzonden.
    - Verouderde fallback: opgeslagen legacy-taken met `notify: true` kunnen nog steeds `cron.webhook` gebruiken totdat ze zijn gemigreerd.

  </Accordion>
</AccordionGroup>

## Chatgedrag

<AccordionGroup>
  <Accordion title="Send and history semantics">
    - `chat.send` is **niet-blokkerend**: bevestigt onmiddellijk met `{ runId, status: "started" }` en de respons wordt gestreamd via `chat`-events.
    - Chat-uploads accepteren afbeeldingen plus niet-videobestanden. Afbeeldingen behouden het native afbeeldingspad; andere bestanden worden opgeslagen als beheerde media en in de geschiedenis getoond als bijlagelinks.
    - Opnieuw verzenden met dezelfde `idempotencyKey` retourneert `{ status: "in_flight" }` zolang de uitvoering loopt, en `{ status: "ok" }` na voltooiing.
    - `chat.history`-responses zijn in grootte begrensd voor UI-veiligheid. Wanneer transcriptvermeldingen te groot zijn, kan de Gateway lange tekstvelden inkorten, zware metadatablokken weglaten en te grote berichten vervangen door een placeholder (`[chat.history omitted: message too large]`).
    - Door de assistent gegenereerde afbeeldingen worden bewaard als beheerde mediareferenties en teruggegeven via geauthenticeerde Gateway-media-URL's, zodat herladen niet afhankelijk is van ruwe base64-afbeeldingspayloads die in de chatgeschiedenisresponse blijven staan.
    - `chat.history` verwijdert ook inline richtlijntags die alleen voor weergave bedoeld zijn uit zichtbare assistenttekst (bijvoorbeeld `[[reply_to_*]]` en `[[audio_as_voice]]`), XML-payloads van tool-calls in platte tekst (waaronder `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en ingekorte tool-call-blokken), en gelekte ASCII-/volledige-breedte modelcontroletokens, en laat assistentvermeldingen weg waarvan de volledige zichtbare tekst alleen het exacte stille token `NO_REPLY` / `no_reply` is.
    - Tijdens een actieve verzending en de uiteindelijke geschiedenisverversing houdt de chatweergave lokale optimistische gebruikers-/assistentberichten zichtbaar als `chat.history` kort een oudere snapshot retourneert; het canonieke transcript vervangt die lokale berichten zodra de Gateway-geschiedenis is bijgewerkt.
    - `chat.inject` voegt een assistentnotitie toe aan het sessietranscript en broadcast een `chat`-event voor updates die alleen voor de UI zijn bedoeld (geen agentuitvoering, geen kanaalbezorging).
    - De model- en thinking-kiezers in de chatheader patchen de actieve sessie onmiddellijk via `sessions.patch`; het zijn persistente sessie-overschrijvingen, geen verzendopties voor slechts één beurt.
    - `/new` typen in de Control UI maakt dezelfde nieuwe dashboardsessie aan als New Chat en schakelt ernaar over. `/reset` typen behoudt de expliciete in-place reset van de Gateway voor de huidige sessie.
    - De chatmodelkiezer vraagt de geconfigureerde modelweergave van de Gateway op. Als `agents.defaults.models` aanwezig is, stuurt die allowlist de kiezer aan. Anders toont de kiezer expliciete `models.providers.*.models`-items plus providers met bruikbare auth. De volledige catalogus blijft beschikbaar via de debug-RPC `models.list` met `view: "all"`.
    - Wanneer verse gebruiksrapporten van Gateway-sessies hoge contextdruk tonen, toont het chatcomposergebied een contextmelding en, bij aanbevolen compaction-niveaus, een compacte knop die het normale sessiecompaction-pad uitvoert. Verouderde tokensnapshots worden verborgen totdat de Gateway opnieuw vers gebruik rapporteert.

  </Accordion>
  <Accordion title="Talk mode (browser realtime)">
    Talk-modus gebruikt een geregistreerde realtime spraakprovider. Configureer OpenAI met `talk.provider: "openai"` plus `talk.providers.openai.apiKey`, of configureer Google met `talk.provider: "google"` plus `talk.providers.google.apiKey`; realtime-providerconfiguratie voor Voice Call kan nog steeds als fallback worden hergebruikt. De browser ontvangt nooit een standaard provider-API-sleutel. OpenAI ontvangt een tijdelijke Realtime client secret voor WebRTC. Google Live ontvangt een eenmalig beperkt Live API-auth-token voor een browser-WebSocket-sessie, waarbij instructies en tooldeclaraties door de Gateway in het token zijn vergrendeld. Providers die alleen een backend realtime bridge aanbieden, draaien via het Gateway-relaytransport, zodat referenties en vendorsockets server-side blijven terwijl browseraudio via geauthenticeerde Gateway-RPC's loopt. De Realtime-sessieprompt wordt samengesteld door de Gateway; `talk.realtime.session` accepteert geen door de aanroeper aangeleverde instructie-overschrijvingen.

    In de chatcomposer is de Talk-bediening de golvenknop naast de microfoonknop voor dicteren. Wanneer Talk start, toont de composerstatusrij `Connecting Talk...`, daarna `Talk live` terwijl audio is verbonden, of `Asking OpenClaw...` terwijl een realtime tool-call het geconfigureerde grotere model raadpleegt via `chat.send`.

    Maintainer-live-smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifieert de OpenAI browser-WebRTC SDP-uitwisseling, de Google Live constrained-token browser-WebSocket-configuratie en de Gateway-relaybrowseradapter met nep-microfoonmedia. De opdracht print alleen providerstatus en logt geen geheimen.

  </Accordion>
  <Accordion title="Stop and abort">
    - Klik op **Stop** (roept `chat.abort` aan).
    - Terwijl een uitvoering actief is, worden normale vervolgberichten in de wachtrij geplaatst. Klik op **Steer** bij een bericht in de wachtrij om dat vervolgbericht in de lopende beurt te injecteren.
    - Typ `/stop` (of zelfstandige afbreekzinnen zoals `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) om out-of-band af te breken.
    - `chat.abort` ondersteunt `{ sessionKey }` (geen `runId`) om alle actieve uitvoeringen voor die sessie af te breken.

  </Accordion>
  <Accordion title="Abort partial retention">
    - Wanneer een uitvoering wordt afgebroken, kan gedeeltelijke assistenttekst nog steeds in de UI worden getoond.
    - Gateway bewaart afgebroken gedeeltelijke assistenttekst in de transcriptgeschiedenis wanneer gebufferde uitvoer bestaat.
    - Bewaarde vermeldingen bevatten afbreekmetadata zodat transcriptconsumenten afgebroken gedeeltelijke uitvoer kunnen onderscheiden van normale voltooiingsuitvoer.

  </Accordion>
</AccordionGroup>

## PWA-installatie en Web Push

De Control UI levert een `manifest.webmanifest` en een serviceworker, zodat moderne browsers deze als zelfstandige PWA kunnen installeren. Met Web Push kan de Gateway de geïnstalleerde PWA wekken met meldingen, zelfs wanneer het tabblad of browservenster niet open is.

| Oppervlak                                             | Wat het doet                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA-manifest. Browsers bieden "App installeren" aan zodra het bereikbaar is. |
| `ui/public/sw.js`                                     | Serviceworker die `push`-events en klikken op meldingen afhandelt. |
| `push/vapid-keys.json` (onder de OpenClaw-statusmap) | Automatisch gegenereerd VAPID-sleutelpaar dat wordt gebruikt om Web Push-payloads te ondertekenen. |
| `push/web-push-subscriptions.json`                    | Bewaarde browserabonnementseindpunten.                          |

Overschrijf het VAPID-sleutelpaar via env-vars op het Gateway-proces wanneer je sleutels wilt vastzetten (voor multi-host deployments, geheimrotatie of tests):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (standaard `mailto:openclaw@localhost`)

De Control UI gebruikt deze scope-gated Gateway-methoden om browserabonnementen te registreren en te testen:

- `push.web.vapidPublicKey` — haalt de actieve openbare VAPID-sleutel op.
- `push.web.subscribe` — registreert een `endpoint` plus `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — verwijdert een geregistreerd eindpunt.
- `push.web.test` — verzendt een testmelding naar het abonnement van de aanroeper.

<Note>
Web Push is onafhankelijk van het iOS APNS-relaypad (zie [Configuratie](/nl/gateway/configuration) voor relay-ondersteunde push) en de bestaande methode `push.test`, die gericht zijn op native mobiele koppeling.
</Note>

## Gehoste embeds

Assistentberichten kunnen gehoste webcontent inline renderen met de shortcode `[embed ...]`. Het iframe-sandboxbeleid wordt beheerd door `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Schakelt scriptuitvoering binnen gehoste embeds uit.
  </Tab>
  <Tab title="scripts (default)">
    Staat interactieve embeds toe terwijl origin-isolatie behouden blijft; dit is de standaard en is meestal voldoende voor zelfstandige browsergames/widgets.
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
Gebruik `trusted` alleen wanneer het ingesloten document daadwerkelijk same-origin-gedrag nodig heeft. Voor de meeste door agents gegenereerde games en interactieve canvassen is `scripts` de veiligere keuze.
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

De waarde wordt gevalideerd voordat deze de browser bereikt. Ondersteunde waarden zijn onder meer gewone lengtes en percentages zoals `960px` of `82%`, plus begrensde breedte-expressies met `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` en `fit-content(...)`.

## Tailnet-toegang (aanbevolen)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Houd de Gateway op loopback en laat Tailscale Serve deze met HTTPS proxyen:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Open:

    - `https://<magicdns>/` (of je geconfigureerde `gateway.controlUi.basePath`)

    Standaard kunnen Control UI-/WebSocket Serve-aanvragen authenticeren via Tailscale-identiteitsheaders (`tailscale-user-login`) wanneer `gateway.auth.allowTailscale` `true` is. OpenClaw verifieert de identiteit door het `x-forwarded-for`-adres op te lossen met `tailscale whois` en dit met de header te matchen, en accepteert deze alleen wanneer de aanvraag loopback bereikt met Tailscale's `x-forwarded-*`-headers. Voor Control UI-operatorsessies met browserapparaatidentiteit slaat dit geverifieerde Serve-pad ook de roundtrip voor apparaatkoppeling over; browsers zonder apparaat en verbindingen met node-rol volgen nog steeds de normale apparaatcontroles. Stel `gateway.auth.allowTailscale: false` in als je expliciete shared-secret-referenties wilt vereisen, zelfs voor Serve-verkeer. Gebruik dan `gateway.auth.mode: "token"` of `"password"`.

    Voor dat asynchrone Serve-identiteitspad worden mislukte auth-pogingen voor hetzelfde client-IP en dezelfde auth-scope geserialiseerd vóór rate-limit-writes. Gelijktijdige slechte nieuwe pogingen vanuit dezelfde browser kunnen daarom `retry later` tonen bij de tweede aanvraag in plaats van twee gewone mismatches die parallel racen.

    <Warning>
    Tokenloze Serve-auth gaat ervan uit dat de gatewayhost vertrouwd is. Als onvertrouwde lokale code op die host kan draaien, vereis dan token-/wachtwoordauthenticatie.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Open daarna:

    - `http://<tailscale-ip>:18789/` (of je geconfigureerde `gateway.controlUi.basePath`)

    Plak het overeenkomende shared secret in de UI-instellingen (verzonden als `connect.params.auth.token` of `connect.params.auth.password`).

  </Tab>
</Tabs>

## Onveilige HTTP

Als je het dashboard opent via gewone HTTP (`http://<lan-ip>` of `http://<tailscale-ip>`), draait de browser in een **niet-beveiligde context** en blokkeert deze WebCrypto. Standaard **blokkeert** OpenClaw Control UI-verbindingen zonder apparaatidentiteit.

Gedocumenteerde uitzonderingen:

- alleen-localhost compatibiliteit met onveilige HTTP met `gateway.controlUi.allowInsecureAuth=true`
- geslaagde operator-Control UI-auth via `gateway.auth.mode: "trusted-proxy"`
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Aanbevolen oplossing:** gebruik HTTPS (Tailscale Serve) of open de UI lokaal:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (op de gatewayhost)

<AccordionGroup>
  <Accordion title="Gedrag van de insecure-auth-schakelaar">
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

    - Hiermee kunnen localhost Control UI-sessies doorgaan zonder apparaatidentiteit in niet-beveiligde HTTP-contexten.
    - Hiermee worden koppelingscontroles niet omzeild.
    - Hiermee worden vereisten voor apparaatidentiteit op afstand (niet-localhost) niet versoepeld.

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
    `dangerouslyDisableDeviceAuth` schakelt apparaatidentiteitscontroles van de Control UI uit en is een ernstige beveiligingsverlaging. Draai dit snel terug na gebruik in noodgevallen.
    </Warning>

  </Accordion>
  <Accordion title="Opmerking over trusted-proxy">
    - Geslaagde trusted-proxy-authenticatie kan **operator** Control UI-sessies toelaten zonder apparaatidentiteit.
    - Dit geldt **niet** voor Control UI-sessies met node-rol.
    - Reverse proxy's via loopback op dezelfde host voldoen nog steeds niet aan trusted-proxy-authenticatie; zie [Trusted proxy auth](/nl/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Zie [Tailscale](/nl/gateway/tailscale) voor begeleiding bij het instellen van HTTPS.

## Contentbeveiligingsbeleid

De Control UI wordt geleverd met een strikt `img-src`-beleid: alleen assets van **dezelfde origin**, `data:`-URL's en lokaal gegenereerde `blob:`-URL's zijn toegestaan. Externe `http(s)`- en protocolrelatieve afbeeldings-URL's worden door de browser geweigerd en veroorzaken geen netwerkverzoeken.

Wat dit in de praktijk betekent:

- Avatars en afbeeldingen die onder relatieve paden worden aangeboden (bijvoorbeeld `/avatars/<id>`) worden nog steeds weergegeven, inclusief geauthenticeerde avatarroutes die de UI ophaalt en omzet naar lokale `blob:`-URL's.
- Inline `data:image/...`-URL's worden nog steeds weergegeven (handig voor payloads binnen het protocol).
- Lokale `blob:`-URL's die door de Control UI zijn gemaakt, worden nog steeds weergegeven.
- Externe avatar-URL's die door kanaalmetadata worden uitgegeven, worden verwijderd door de avatarhelpers van de Control UI en vervangen door het ingebouwde logo/de badge, zodat een gecompromitteerd of kwaadwillend kanaal geen willekeurige externe afbeeldingsverzoeken vanuit de browser van een operator kan afdwingen.

Je hoeft niets te wijzigen om dit gedrag te krijgen — het staat altijd aan en is niet configureerbaar.

## Authenticatie voor avatarroutes

Wanneer Gateway-authenticatie is geconfigureerd, vereist het avatarendpoint van de Control UI hetzelfde gateway-token als de rest van de API:

- `GET /avatar/<agentId>` retourneert de avatarafbeelding alleen aan geauthenticeerde callers. `GET /avatar/<agentId>?meta=1` retourneert de avatarmetadata volgens dezelfde regel.
- Niet-geauthenticeerde verzoeken naar een van beide routes worden geweigerd (net als bij de gerelateerde assistant-media-route). Dit voorkomt dat de avatarroute agentidentiteit lekt op hosts die verder beschermd zijn.
- De Control UI stuurt zelf het Gateway-token door als bearer-header bij het ophalen van avatars en gebruikt geauthenticeerde blob-URL's zodat de afbeelding nog steeds in dashboards wordt weergegeven.

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

Wijs de UI vervolgens naar je Gateway WS-URL (bijv. `ws://127.0.0.1:18789`).

## Debuggen/testen: ontwikkelserver + externe Gateway

De Control UI bestaat uit statische bestanden; het WebSocket-doel is configureerbaar en kan verschillen van de HTTP-origin. Dit is handig wanneer je de Vite-ontwikkelserver lokaal wilt gebruiken, maar de Gateway elders draait.

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
    - Als je een volledig `ws://`- of `wss://`-endpoint via `gatewayUrl` doorgeeft, URL-encodeer dan de waarde van `gatewayUrl` zodat de browser de querystring correct parseert.
    - `token` moet waar mogelijk via het URL-fragment (`#token=...`) worden doorgegeven. Fragmenten worden niet naar de server gestuurd, waardoor lekkage via requestlogs en Referer wordt voorkomen. Verouderde `?token=`-queryparameters worden voor compatibiliteit nog één keer geïmporteerd, maar alleen als fallback, en worden direct na bootstrap verwijderd.
    - `password` wordt alleen in het geheugen bewaard.
    - Wanneer `gatewayUrl` is ingesteld, valt de UI niet terug op configuratie- of omgevingsreferenties. Geef `token` (of `password`) expliciet op. Ontbrekende expliciete referenties zijn een fout.
    - Gebruik `wss://` wanneer de Gateway achter TLS staat (Tailscale Serve, HTTPS-proxy, enz.).
    - `gatewayUrl` wordt alleen geaccepteerd in een venster op topniveau (niet embedded) om clickjacking te voorkomen.
    - Niet-loopback Control UI-deployments moeten `gateway.controlUi.allowedOrigins` expliciet instellen (volledige origins). Dit omvat externe ontwikkelsetups.
    - Het opstarten van de Gateway kan lokale origins zoals `http://localhost:<port>` en `http://127.0.0.1:<port>` initialiseren op basis van de effectieve runtime-bind en poort, maar externe browser-origins hebben nog steeds expliciete vermeldingen nodig.
    - Gebruik `gateway.controlUi.allowedOrigins: ["*"]` niet, behalve voor strikt gecontroleerde lokale tests. Het betekent dat elke browser-origin wordt toegestaan, niet "match de host die ik gebruik."
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

Details voor het instellen van externe toegang: [Externe toegang](/nl/gateway/remote).

## Gerelateerd

- [Dashboard](/nl/web/dashboard) — Gateway-dashboard
- [Health Checks](/nl/gateway/health) — Gateway-healthmonitoring
- [TUI](/nl/web/tui) — terminalgebruikersinterface
- [WebChat](/nl/web/webchat) — browsergebaseerde chatinterface
