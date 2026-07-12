---
read_when:
    - Werken aan functies voor het Google Chat-kanaal
summary: Ondersteuningsstatus, mogelijkheden en configuratie van de Google Chat-app
title: Google Chat
x-i18n:
    generated_at: "2026-07-12T08:35:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72a08c41f7da019f91265cbf7ae73134a0767c603449ebd8cd9a5354936a3b52
    source_path: channels/googlechat.md
    workflow: 16
---

Google Chat wordt uitgevoerd als de officiële Plugin `@openclaw/googlechat`: privéberichten en ruimtes via webhooks van de Google Chat API (alleen HTTP-eindpunt, geen Pub/Sub).

## Installatie

```bash
openclaw plugins install @openclaw/googlechat
```

Lokale checkout (bij uitvoering vanuit een git-repository):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Snelle configuratie (voor beginners)

1. Maak een Google Cloud-project en schakel de **Google Chat API** in.
   - Ga naar: [Google Chat API-referenties](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Schakel de API in als deze nog niet is ingeschakeld.
2. Maak een **serviceaccount**:
   - Klik op **Create Credentials** > **Service Account**.
   - Geef het een naam naar keuze (bijvoorbeeld `openclaw-chat`).
   - Laat machtigingen en principals leeg (**Continue** en vervolgens **Done**).
3. Maak en download de **JSON-sleutel**:
   - Klik op het nieuwe serviceaccount > tabblad **Keys** > **Add Key** > **Create new key** > **JSON** > **Create**.
4. Sla het gedownloade JSON-bestand op de host van uw Gateway op (bijvoorbeeld `~/.openclaw/googlechat-service-account.json`).
5. Maak een Google Chat-app in [Google Cloud Console Chat-configuratie](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Vul **Application info** in (appnaam, avatar-URL, beschrijving).
   - Schakel **Interactive features** in.
   - Vink onder **Functionality** de optie **Join spaces and group conversations** aan.
   - Selecteer onder **Connection settings** de optie **HTTP endpoint URL**.
   - Selecteer onder **Triggers** de optie **Use a common HTTP endpoint URL for all triggers** en stel deze in op de openbare URL van uw Gateway, gevolgd door `/googlechat` (zie [Openbare URL](#public-url-webhook-only)).
   - Vink onder **Visibility** de optie **Make this Chat app available to specific people and groups in `<Your Domain>`** aan en voer uw e-mailadres in.
   - Klik op **Save**.
6. Schakel de appstatus in: vernieuw de pagina, zoek **App status**, stel deze in op **Live - available to users** en klik opnieuw op **Save**.
7. Configureer OpenClaw met het serviceaccount en de doelgroep van de Webhook (moet overeenkomen met de configuratie van de Chat-app):
   - Omgevingsvariabele: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json` (alleen standaardaccount), of
   - Configuratie: zie [Belangrijkste configuratieopties](#config-highlights). `openclaw channels add --channel googlechat` accepteert ook `--audience-type`, `--audience`, `--webhook-path` en `--webhook-url`.
8. Start de Gateway. Google Chat verstuurt POST-verzoeken naar het pad van uw Webhook (standaard `/googlechat`).

## Toevoegen aan Google Chat

Zodra de Gateway actief is en uw e-mailadres op de zichtbaarheidslijst staat:

1. Ga naar [Google Chat](https://chat.google.com/).
2. Klik op het pictogram **+** (plus) naast **Direct Messages**.
3. Zoek naar de **App name** die u in de Google Cloud Console hebt geconfigureerd.
   - De bot verschijnt _niet_ in de bladerlijst van de Marketplace omdat het een privé-app is; zoek de bot op naam.
4. Selecteer de bot, klik op **Add** of **Chat** en stuur een bericht.

## Openbare URL (alleen Webhook)

Google Chat-webhooks vereisen een openbaar HTTPS-eindpunt. Stel voor de veiligheid **alleen het pad `/googlechat`** bloot aan internet en houd het OpenClaw-dashboard en andere eindpunten privé.

### Optie A: Tailscale Funnel (aanbevolen)

Gebruik Tailscale Serve voor het privédashboard en Funnel voor het openbare Webhook-pad.

1. Controleer aan welk adres uw Gateway is gebonden:

   ```bash
   ss -tlnp | grep 18789
   ```

   Noteer het IP-adres (bijvoorbeeld `127.0.0.1`, `0.0.0.0` of een Tailscale-adres van het type `100.x.x.x`).

2. Stel het dashboard alleen beschikbaar aan het tailnet (poort 8443):

   ```bash
   # Indien gebonden aan localhost (127.0.0.1 of 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Indien alleen gebonden aan een Tailscale-IP:
   tailscale serve --bg --https 8443 http://100.x.x.x:18789
   ```

3. Stel alleen het Webhook-pad openbaar beschikbaar:

   ```bash
   # Indien gebonden aan localhost (127.0.0.1 of 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Indien alleen gebonden aan een Tailscale-IP:
   tailscale funnel --bg --set-path /googlechat http://100.x.x.x:18789/googlechat
   ```

4. Ga desgevraagd naar de autorisatie-URL die in de uitvoer wordt weergegeven om Funnel voor deze Node in te schakelen.

5. Controleer:

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Uw openbare Webhook-URL is `https://<node-name>.<tailnet>.ts.net/googlechat`; het dashboard blijft alleen via het tailnet toegankelijk op `https://<node-name>.<tailnet>.ts.net:8443/`. Gebruik de openbare URL (zonder `:8443`) in de configuratie van de Google Chat-app.

> Opmerking: deze configuratie blijft na opnieuw opstarten behouden. Verwijder deze later met `tailscale funnel reset` en `tailscale serve reset`.

### Optie B: reverseproxy (Caddy)

Proxy alleen het Webhook-pad:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Verzoeken aan `your-domain.com/` worden genegeerd of krijgen een 404-antwoord, terwijl `your-domain.com/googlechat` naar OpenClaw wordt gerouteerd.

### Optie C: Cloudflare Tunnel

Configureer de ingressregels van de tunnel zodat alleen het Webhook-pad wordt gerouteerd:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default rule**: HTTP 404 (Not Found)

## Werking

1. Google Chat verstuurt JSON via POST naar het Webhook-pad van de Gateway (alleen POST, JSON-inhoudstype vereist, snelheidsbeperking per IP-adres).
2. OpenClaw authenticeert elk verzoek voordat het wordt doorgestuurd:
   - Gebeurtenissen van de Chat-app bevatten `Authorization: Bearer <token>`; het token wordt geverifieerd voordat de volledige hoofdtekst wordt geparseerd.
   - Gebeurtenissen van Google Workspace-add-ons bevatten het token in de hoofdtekst (`authorizationEventObject.systemIdToken`) en worden vóór verificatie gelezen met een strikter pre-authenticatiebudget (16 KB, 3 s).
3. Het token wordt gecontroleerd aan de hand van `audienceType` + `audience`:
   - `audienceType: "app-url"` → de doelgroep is de HTTPS-URL van uw Webhook.
   - `audienceType: "project-number"` → de doelgroep is het nummer van het Cloud-project.
   - Voor add-ontokens onder `app-url` moet `appPrincipal` bovendien zijn ingesteld op de numerieke OAuth 2.0-client-ID van de app (21 cijfers, geen e-mailadres); anders mislukt de verificatie en wordt een waarschuwing geregistreerd.
4. Berichten worden per ruimte gerouteerd:
   - Ruimtes krijgen sessies per ruimte: `agent:<agentId>:googlechat:group:<spaceId>`; antwoorden gaan naar de berichtenthread.
   - Privéberichten worden standaard samengevoegd met de hoofdsessie van de agent; stel `session.dmScope` in voor privéberichtsessies per gesprekspartner (zie [Sessie](/nl/concepts/session)).
5. Toegang via privéberichten werkt standaard met koppeling. Onbekende afzenders ontvangen een koppelingscode; keur deze goed met:
   - `openclaw pairing approve googlechat <code>`
6. Groepsruimtes vereisen standaard een @-vermelding. Vermeldingen worden gedetecteerd via Chat-annotaties van het type `USER_MENTION` die op de app zijn gericht; stel `botUser` in (bijvoorbeeld `users/1234567890`) als voor de detectie de naam van de gebruikersresource van de app nodig is.
7. Wanneer een uitvoerings- of Plugin-goedkeuring vanuit Google Chat wordt gestart en een stabiele fiatteur van het type `users/<id>` is geconfigureerd, plaatst OpenClaw een systeemeigen goedkeuringskaart (`cardsV2`) in de oorspronkelijke ruimte of thread. Kaartknoppen bevatten ondoorzichtige callbacktokens; de handmatige prompt `/approve <id> <decision>` verschijnt alleen wanneer systeemeigen bezorging niet beschikbaar is.

## Doelen

Gebruik deze identificaties voor bezorging en toelatingslijsten:

- Privéberichten: `users/<userId>` (aanbevolen).
- Ruimtes: `spaces/<spaceId>`.
- Een onbewerkt e-mailadres zoals `name@example.com` is veranderlijk en wordt alleen gebruikt voor vergelijking met toelatingslijsten wanneer `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Afgekeurd: `users/<email>` wordt behandeld als een gebruikers-ID, niet als een e-mailvermelding in een toelatingslijst.
- De voorvoegsels `googlechat:`, `google-chat:` en `gchat:` worden geaccepteerd en verwijderd.

## Belangrijkste configuratieopties

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // of serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      appPrincipal: "123456789012345678901", // alleen verificatie van add-ons; numerieke OAuth-client-ID
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optioneel; helpt bij detectie van vermeldingen
      allowBots: false,
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          enabled: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Alleen korte antwoorden.",
        },
      },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Opmerkingen:

- Referenties van het serviceaccount: `serviceAccountFile` (pad), `serviceAccount` (inline JSON-tekenreeks of -object) of `serviceAccountRef` (SecretRef voor omgevingsvariabele/bestand). De omgevingsvariabelen `GOOGLE_CHAT_SERVICE_ACCOUNT` (inline JSON) en `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (pad) gelden alleen voor het standaardaccount. Configuraties met meerdere accounts gebruiken `channels.googlechat.accounts.<id>` met dezelfde sleutels, inclusief een `serviceAccountRef` per account.
- Het standaardpad van de Webhook is `/googlechat` wanneer `webhookPath` niet is ingesteld; `webhookUrl` kan in plaats daarvan het pad leveren.
- Groepssleutels moeten stabiele ruimte-ID's zijn (`spaces/<spaceId>`). Sleutels met weergavenamen zijn afgekeurd en worden als zodanig geregistreerd.
- `dangerouslyAllowNameMatching` schakelt vergelijking van veranderlijke e-mailprincipals voor toelatingslijsten opnieuw in (compatibiliteitsmodus voor noodgevallen); doctor waarschuwt voor e-mailvermeldingen.
- Reactieacties van Google Chat worden niet beschikbaar gesteld. De Plugin gebruikt serviceaccountauthenticatie, terwijl reactie-eindpunten van Google Chat gebruikersauthenticatie vereisen. Bestaande configuratie voor `actions.reactions` wordt voor compatibiliteit geaccepteerd, maar heeft geen effect.
- Systeemeigen goedkeuringskaarten gebruiken klikken op Google Chat-knoppen van `cardsV2`, niet reactiegebeurtenissen. Fiatteurs zijn afkomstig uit `dm.allowFrom` of `defaultTo` en moeten stabiele numerieke waarden van het type `users/<id>` zijn.
- Berichtacties stellen alleen tekstueel `send` beschikbaar. Het uploaden van Google Chat-bijlagen vereist gebruikersauthenticatie, terwijl deze Plugin serviceaccountauthenticatie gebruikt. Daarom is het uploaden van uitgaande bestanden niet beschikbaar.
- `typingIndicator`: `message` (standaard) plaatst een tijdelijke aanduiding `_<Bot> is aan het typen..._` en bewerkt deze tot het eerste antwoord; `none` schakelt dit uit; `reaction` vereist OAuth voor gebruikers en valt bij serviceaccountauthenticatie momenteel terug op `message`, waarbij een fout wordt geregistreerd.
- Inkomende bijlagen (de eerste bijlage per bericht) worden via de Chat API naar de mediapijplijn gedownload en beperkt door `mediaMaxMb` (standaard 20).
- Door bots geschreven berichten worden standaard genegeerd. Met `allowBots: true` gebruiken geaccepteerde botberichten de gedeelde [bescherming tegen botlussen](/nl/channels/bot-loop-protection): configureer `channels.defaults.botLoopProtection` en overschrijf deze vervolgens met `channels.googlechat.botLoopProtection` of `channels.googlechat.groups.<space>.botLoopProtection`.

Details over verwijzingen naar geheimen: [Geheimenbeheer](/nl/gateway/secrets).

## Probleemoplossing

### 405 Methode niet toegestaan

Als Google Cloud Logs Explorer fouten toont zoals:

```text
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

De Webhook-handler is niet geregistreerd. Veelvoorkomende oorzaken:

1. **Kanaal niet geconfigureerd**: de sectie `channels.googlechat` ontbreekt. Controleer dit met:

   ```bash
   openclaw config get channels.googlechat
   ```

   Als dit "Configuratiepad niet gevonden" retourneert, voegt u de configuratie toe (zie [Belangrijkste configuratieopties](#config-highlights)).

2. **Plugin niet ingeschakeld**: controleer de status van de Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Als "uitgeschakeld" wordt weergegeven, voegt u `plugins.entries.googlechat.enabled: true` toe aan uw configuratie.

3. **Gateway niet opnieuw gestart** na configuratiewijzigingen:

   ```bash
   openclaw gateway restart
   ```

Controleer of het kanaal actief is:

```bash
openclaw channels status
# Moet tonen: Google Chat standaard: ingeschakeld, geconfigureerd, ...
```

### Andere problemen

- `openclaw channels status --probe` toont authenticatiefouten en ontbrekende doelgroepconfiguratie (`audience` en `audienceType` zijn beide vereist).
- Als er geen berichten binnenkomen, controleert u de Webhook-URL en triggerconfiguratie van de Chat-app.
- Als de vermeldingsbeperking antwoorden blokkeert, stelt u `botUser` in op de naam van de gebruikersresource van de app en controleert u `requireMention`.
- `openclaw logs --follow` toont tijdens het verzenden van een testbericht of verzoeken de Gateway bereiken.

## Gerelateerd

- [Overzicht van kanalen](/nl/channels) — alle ondersteunde kanalen
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Gateway-configuratie](/nl/gateway/configuration)
- [Groepen](/nl/channels/groups) — gedrag van groepschats en vermeldingscontrole
- [Koppelen](/nl/channels/pairing) — DM-authenticatie en koppelingsproces
- [Beveiliging](/nl/gateway/security) — toegangsmodel en versterking
