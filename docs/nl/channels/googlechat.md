---
read_when:
    - Werken aan Google Chat-kanaalfuncties
summary: Status, mogelijkheden en configuratie van Google Chat-appondersteuning
title: Google Chat
x-i18n:
    generated_at: "2026-06-27T17:09:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d506f6e92bfb73940254ca906c7581f24ac49d3f498fcae213eae71c4449442
    source_path: channels/googlechat.md
    workflow: 16
---

Status: downloadbare Plugin voor DM's + spaces via Google Chat API-Webhooks (alleen HTTP).

## Installeren

Installeer Google Chat voordat je het kanaal configureert:

```bash
openclaw plugins install @openclaw/googlechat
```

Lokale checkout (wanneer je vanuit een git-repo draait):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Snelle installatie (beginner)

1. Maak een Google Cloud-project en schakel de **Google Chat API** in.
   - Ga naar: [Google Chat API-referenties](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Schakel de API in als deze nog niet is ingeschakeld.
2. Maak een **Service Account**:
   - Klik op **Create Credentials** > **Service Account**.
   - Geef het een naam naar keuze (bijv. `openclaw-chat`).
   - Laat machtigingen leeg (klik op **Continue**).
   - Laat principals met toegang leeg (klik op **Done**).
3. Maak en download de **JSON Key**:
   - Klik in de lijst met serviceaccounts op degene die je net hebt gemaakt.
   - Ga naar het tabblad **Keys**.
   - Klik op **Add Key** > **Create new key**.
   - Selecteer **JSON** en klik op **Create**.
4. Sla het gedownloade JSON-bestand op je gatewayhost op (bijv. `~/.openclaw/googlechat-service-account.json`).
5. Maak een Google Chat-app in de [Google Cloud Console Chat-configuratie](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Vul de **Application info** in:
     - **App name**: (bijv. `OpenClaw`)
     - **Avatar URL**: (bijv. `https://openclaw.ai/logo.png`)
     - **Description**: (bijv. `Personal AI Assistant`)
   - Schakel **Interactive features** in.
   - Vink onder **Functionality** **Join spaces and group conversations** aan.
   - Selecteer onder **Connection settings** **HTTP endpoint URL**.
   - Selecteer onder **Triggers** **Use a common HTTP endpoint URL for all triggers** en stel dit in op de openbare URL van je Gateway gevolgd door `/googlechat`.
     - _Tip: voer `openclaw status` uit om de openbare URL van je Gateway te vinden._
   - Vink onder **Visibility** **Make this Chat app available to specific people and groups in `<Your Domain>`** aan.
   - Voer je e-mailadres in (bijv. `user@example.com`) in het tekstvak.
   - Klik onderaan op **Save**.
6. **Schakel de appstatus in**:
   - **Vernieuw de pagina** na het opslaan.
   - Zoek naar de sectie **App status** (meestal bovenaan of onderaan na het opslaan).
   - Wijzig de status naar **Live - available to users**.
   - Klik opnieuw op **Save**.
7. Configureer OpenClaw met het serviceaccountpad + Webhook-doelgroep:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Of config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Stel het Webhook-doelgroeptype + de waarde in (komt overeen met je Chat-appconfiguratie).
9. Start de Gateway. Google Chat doet een POST naar je Webhook-pad.

## Toevoegen aan Google Chat

Zodra de Gateway draait en je e-mailadres aan de zichtbaarheidslijst is toegevoegd:

1. Ga naar [Google Chat](https://chat.google.com/).
2. Klik op het **+**-pictogram (plus) naast **Direct Messages**.
3. Typ in de zoekbalk (waar je normaal mensen toevoegt) de **App name** die je in de Google Cloud Console hebt geconfigureerd.
   - **Opmerking**: de bot verschijnt _niet_ in de bladerlijst "Marketplace" omdat het een privé-app is. Je moet er op naam naar zoeken.
4. Selecteer je bot uit de resultaten.
5. Klik op **Add** of **Chat** om een 1-op-1-gesprek te starten.
6. Stuur "Hallo" om de assistent te activeren!

## Openbare URL (alleen Webhook)

Google Chat-Webhooks vereisen een openbaar HTTPS-eindpunt. Stel om veiligheidsredenen **alleen het pad `/googlechat`** bloot aan het internet. Houd het OpenClaw-dashboard en andere gevoelige eindpunten op je privénetwerk.

### Optie A: Tailscale Funnel (aanbevolen)

Gebruik Tailscale Serve voor het privédashboard en Funnel voor het openbare Webhook-pad. Zo blijft `/` privé terwijl alleen `/googlechat` wordt blootgesteld.

1. **Controleer aan welk adres je Gateway is gebonden:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Noteer het IP-adres (bijv. `127.0.0.1`, `0.0.0.0`, of je Tailscale-IP zoals `100.x.x.x`).

2. **Stel het dashboard alleen bloot aan de tailnet (poort 8443):**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Stel alleen het Webhook-pad openbaar bloot:**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Autoriseer de node voor Funnel-toegang:**
   Bezoek, indien gevraagd, de autorisatie-URL die in de uitvoer wordt getoond om Funnel voor deze node in je tailnet-beleid in te schakelen.

5. **Controleer de configuratie:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Je openbare Webhook-URL wordt:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Je privédashboard blijft alleen toegankelijk via de tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

Gebruik de openbare URL (zonder `:8443`) in de Google Chat-appconfiguratie.

> Opmerking: deze configuratie blijft behouden na herstarts. Om deze later te verwijderen, voer je `tailscale funnel reset` en `tailscale serve reset` uit.

### Optie B: Reverse proxy (Caddy)

Als je een reverse proxy zoals Caddy gebruikt, proxy dan alleen het specifieke pad:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Met deze configuratie wordt elk verzoek naar `your-domain.com/` genegeerd of als 404 geretourneerd, terwijl `your-domain.com/googlechat` veilig naar OpenClaw wordt gerouteerd.

### Optie C: Cloudflare Tunnel

Configureer de ingress-regels van je tunnel om alleen het Webhook-pad te routeren:

- **Pad**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Standaardregel**: HTTP 404 (Not Found)

## Hoe het werkt

1. Google Chat stuurt Webhook-POST's naar de Gateway. Elk verzoek bevat een header `Authorization: Bearer <token>`.
   - OpenClaw verifieert bearer-auth voordat volledige Webhook-bodies worden gelezen/geparsed wanneer de header aanwezig is.
   - Google Workspace Add-on-verzoeken die `authorizationEventObject.systemIdToken` in de body bevatten, worden ondersteund via een strikter pre-auth bodybudget.
2. OpenClaw verifieert het token tegen het geconfigureerde `audienceType` + `audience`:
   - `audienceType: "app-url"` → doelgroep is je HTTPS-Webhook-URL.
   - `audienceType: "project-number"` → doelgroep is het Cloud-projectnummer.
3. Berichten worden per space gerouteerd:
   - DM's gebruiken sessiesleutel `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Spaces gebruiken sessiesleutel `agent:<agentId>:googlechat:group:<spaceId>`.
4. DM-toegang werkt standaard via pairing. Onbekende afzenders ontvangen een pairingcode; keur goed met:
   - `openclaw pairing approve googlechat <code>`
5. Groepsspaces vereisen standaard een @-mention. Gebruik `botUser` als mentiondetectie de gebruikersnaam van de app nodig heeft.
6. Wanneer een uitvoerings- of Plugin-goedkeuringsverzoek vanuit Google Chat start en een stabiele `users/<id>`-goedkeurder is geconfigureerd, plaatst OpenClaw een native Google Chat-goedkeuringskaart in de oorspronkelijke space of thread. De knoppen op de kaart gebruiken ondoorzichtige callbacktokens, en de handmatige prompt `/approve <id> <decision>` wordt alleen getoond wanneer native levering van goedkeuringen niet beschikbaar is.

## Doelen

Gebruik deze identifiers voor bezorging en allowlists:

- Direct messages: `users/<userId>` (aanbevolen).
- Ruw e-mailadres `name@example.com` is veranderlijk en wordt alleen gebruikt voor directe allowlist-matching wanneer `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Verouderd: `users/<email>` wordt behandeld als gebruikers-id, niet als e-mailallowlist.
- Spaces: `spaces/<spaceId>`.

## Configuratiehoogtepunten

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
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
          systemPrompt: "Short answers only.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Opmerkingen:

- Serviceaccountreferenties kunnen ook inline worden doorgegeven met `serviceAccount` (JSON-string).
- `serviceAccountRef` wordt ook ondersteund (env/file SecretRef), inclusief refs per account onder `channels.googlechat.accounts.<id>.serviceAccountRef`.
- Het standaard Webhook-pad is `/googlechat` als `webhookPath` niet is ingesteld.
- `dangerouslyAllowNameMatching` schakelt veranderlijke e-mailprincipal-matching voor allowlists opnieuw in (break-glass-compatibiliteitsmodus).
- Reacties zijn beschikbaar via de tool `reactions` en `channels action` wanneer `actions.reactions` is ingeschakeld.
- Native goedkeuringskaarten gebruiken Google Chat-klikacties op `cardsV2`-knoppen, geen reactie-events. Goedkeurders komen uit `dm.allowFrom` of `defaultTo` en moeten stabiele numerieke `users/<id>`-waarden zijn.
- Berichtacties bieden `send` voor tekst en `upload-file` voor expliciete bijlageverzendingen. `upload-file` accepteert `media` / `filePath` / `path` plus optioneel `message`, `filename` en threadtargeting.
- `typingIndicator` ondersteunt `message` (standaard), `none` en `reaction` (reactie vereist gebruikers-OAuth).
- Bijlagen worden via de Chat API gedownload en opgeslagen in de mediapijplijn (grootte begrensd door `mediaMaxMb`).
- Door bots geschreven Google Chat-berichten worden standaard genegeerd. Als je bewust `allowBots: true` instelt, gebruiken geaccepteerde door bots geschreven berichten gedeelde [botlusbescherming](/nl/channels/bot-loop-protection). Configureer `channels.defaults.botLoopProtection` en overschrijf daarna met `channels.googlechat.botLoopProtection` of `channels.googlechat.groups.<space>.botLoopProtection` wanneer één space een ander budget nodig heeft.

Details over secrets-referenties: [Secrets-beheer](/nl/gateway/secrets).

## Probleemoplossing

### 405 Method Not Allowed

Als Google Cloud Logs Explorer fouten toont zoals:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Betekent dit dat de Webhook-handler niet is geregistreerd. Veelvoorkomende oorzaken:

1. **Kanaal niet geconfigureerd**: de sectie `channels.googlechat` ontbreekt in je configuratie. Controleer met:

   ```bash
   openclaw config get channels.googlechat
   ```

   Als dit "Config path not found" retourneert, voeg dan de configuratie toe (zie [Configuratiehoogtepunten](#config-highlights)).

2. **Plugin niet ingeschakeld**: controleer de Plugin-status:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Als dit "disabled" toont, voeg dan `plugins.entries.googlechat.enabled: true` toe aan je configuratie.

3. **Gateway niet opnieuw gestart**: start de Gateway opnieuw nadat je de configuratie hebt toegevoegd:

   ```bash
   openclaw gateway restart
   ```

Controleer of het kanaal draait:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Andere problemen

- Controleer `openclaw channels status --probe` op authfouten of ontbrekende doelgroepconfiguratie.
- Als er geen berichten binnenkomen, controleer dan de Webhook-URL + eventabonnementen van de Chat-app.
- Als mention-gating antwoorden blokkeert, stel dan `botUser` in op de gebruikersresourcenaam van de app en verifieer `requireMention`.
- Gebruik `openclaw logs --follow` terwijl je een testbericht verzendt om te zien of verzoeken de Gateway bereiken.

Gerelateerde documentatie:

- [Gateway-configuratie](/nl/gateway/configuration)
- [Beveiliging](/nl/gateway/security)
- [Reacties](/nl/tools/reactions)

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [Koppelen](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — gedrag van groepschats en gating voor vermeldingen
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
