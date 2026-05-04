---
read_when:
    - Werken aan functies voor het Google Chat-kanaal
summary: Ondersteuningsstatus, mogelijkheden en configuratie van de Google Chat-app
title: Google Chat
x-i18n:
    generated_at: "2026-05-04T02:21:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: afa2ca4d9673396aa24a55ca5855a34ad26a4640c3a1f6928dbf7246e403cb04
    source_path: channels/googlechat.md
    workflow: 16
---

Status: downloadbare plugin voor DM's + ruimtes via webhooks van de Google Chat API (alleen HTTP).

## Installeren

Installeer Google Chat voordat je het kanaal configureert:

```bash
openclaw plugins install @openclaw/googlechat
```

Lokale checkout (wanneer je vanuit een git-repo werkt):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Snelle installatie (beginner)

1. Maak een Google Cloud-project en schakel de **Google Chat API** in.
   - Ga naar: [Google Chat API-referenties](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Schakel de API in als deze nog niet is ingeschakeld.
2. Maak een **Service Account**:
   - Druk op **Referenties maken** > **Service Account**.
   - Geef het een willekeurige naam (bijv. `openclaw-chat`).
   - Laat machtigingen leeg (druk op **Doorgaan**).
   - Laat principals met toegang leeg (druk op **Gereed**).
3. Maak en download de **JSON-sleutel**:
   - Klik in de lijst met serviceaccounts op het account dat je net hebt gemaakt.
   - Ga naar het tabblad **Sleutels**.
   - Klik op **Sleutel toevoegen** > **Nieuwe sleutel maken**.
   - Selecteer **JSON** en druk op **Maken**.
4. Sla het gedownloade JSON-bestand op je gatewayhost op (bijv. `~/.openclaw/googlechat-service-account.json`).
5. Maak een Google Chat-app in de [Google Cloud Console Chat-configuratie](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Vul de **Applicatiegegevens** in:
     - **Appnaam**: (bijv. `OpenClaw`)
     - **Avatar-URL**: (bijv. `https://openclaw.ai/logo.png`)
     - **Beschrijving**: (bijv. `Personal AI Assistant`)
   - Schakel **Interactieve functies** in.
   - Vink onder **Functionaliteit** **Deelnemen aan ruimtes en groepsgesprekken** aan.
   - Selecteer onder **Verbindingsinstellingen** **HTTP-eindpunt-URL**.
   - Selecteer onder **Triggers** **Een gemeenschappelijke HTTP-eindpunt-URL gebruiken voor alle triggers** en stel deze in op de openbare URL van je Gateway, gevolgd door `/googlechat`.
     - _Tip: voer `openclaw status` uit om de openbare URL van je Gateway te vinden._
   - Vink onder **Zichtbaarheid** **Deze Chat-app beschikbaar maken voor specifieke mensen en groepen in `<Your Domain>`** aan.
   - Voer je e-mailadres (bijv. `user@example.com`) in het tekstvak in.
   - Klik onderaan op **Opslaan**.
6. **Schakel de appstatus in**:
   - **Vernieuw de pagina** na het opslaan.
   - Zoek de sectie **Appstatus** (meestal bovenaan of onderaan na het opslaan).
   - Wijzig de status naar **Live - beschikbaar voor gebruikers**.
   - Klik opnieuw op **Opslaan**.
7. Configureer OpenClaw met het serviceaccountpad + de webhookdoelgroep:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Of config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Stel het webhookdoelgroeptype + de waarde in (komt overeen met je Chat-appconfiguratie).
9. Start de Gateway. Google Chat stuurt POST-verzoeken naar je webhookpad.

## Toevoegen aan Google Chat

Zodra de Gateway draait en je e-mail aan de zichtbaarheidslijst is toegevoegd:

1. Ga naar [Google Chat](https://chat.google.com/).
2. Klik op het **+**-pictogram (plus) naast **Directe berichten**.
3. Typ in de zoekbalk (waar je normaal mensen toevoegt) de **Appnaam** die je in de Google Cloud Console hebt geconfigureerd.
   - **Opmerking**: de bot verschijnt _niet_ in de bladerlijst "Marketplace", omdat het een privé-app is. Je moet er op naam naar zoeken.
4. Selecteer je bot uit de resultaten.
5. Klik op **Toevoegen** of **Chatten** om een 1-op-1-gesprek te starten.
6. Stuur "Hallo" om de assistent te activeren!

## Openbare URL (alleen webhook)

Google Chat-webhooks vereisen een openbaar HTTPS-eindpunt. Stel om veiligheidsredenen **alleen het pad `/googlechat`** bloot aan internet. Houd het OpenClaw-dashboard en andere gevoelige eindpunten op je privénetwerk.

### Optie A: Tailscale Funnel (aanbevolen)

Gebruik Tailscale Serve voor het privédashboard en Funnel voor het openbare webhookpad. Zo blijft `/` privé terwijl alleen `/googlechat` wordt blootgesteld.

1. **Controleer aan welk adres je Gateway is gebonden:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Noteer het IP-adres (bijv. `127.0.0.1`, `0.0.0.0`, of je Tailscale-IP zoals `100.x.x.x`).

2. **Stel het dashboard alleen beschikbaar voor het tailnet (poort 8443):**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Stel alleen het webhookpad openbaar beschikbaar:**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Autoriseer de Node voor Funnel-toegang:**
   Als daarom wordt gevraagd, bezoek je de autorisatie-URL die in de uitvoer wordt getoond om Funnel voor deze Node in je tailnetbeleid in te schakelen.

5. **Controleer de configuratie:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Je openbare webhook-URL is:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Je privédashboard blijft alleen beschikbaar binnen het tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

Gebruik de openbare URL (zonder `:8443`) in de Google Chat-appconfiguratie.

> Opmerking: deze configuratie blijft behouden na herstarts. Voer later `tailscale funnel reset` en `tailscale serve reset` uit om deze te verwijderen.

### Optie B: Reverse proxy (Caddy)

Als je een reverse proxy zoals Caddy gebruikt, proxy dan alleen het specifieke pad:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Met deze config wordt elk verzoek naar `your-domain.com/` genegeerd of als 404 teruggegeven, terwijl `your-domain.com/googlechat` veilig naar OpenClaw wordt gerouteerd.

### Optie C: Cloudflare Tunnel

Configureer de ingressregels van je tunnel om alleen het webhookpad te routeren:

- **Pad**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Standaardregel**: HTTP 404 (Niet gevonden)

## Hoe het werkt

1. Google Chat stuurt webhook-POST's naar de Gateway. Elk verzoek bevat een header `Authorization: Bearer <token>`.
   - OpenClaw verifieert bearer-authenticatie voordat volledige webhookbody's worden gelezen/geparseerd wanneer de header aanwezig is.
   - Google Workspace Add-on-verzoeken die `authorizationEventObject.systemIdToken` in de body bevatten, worden ondersteund via een strikter pre-auth-bodybudget.
2. OpenClaw verifieert het token tegen de geconfigureerde `audienceType` + `audience`:
   - `audienceType: "app-url"` → audience is je HTTPS-webhook-URL.
   - `audienceType: "project-number"` → audience is het Cloud-projectnummer.
3. Berichten worden per ruimte gerouteerd:
   - DM's gebruiken sessiesleutel `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Ruimtes gebruiken sessiesleutel `agent:<agentId>:googlechat:group:<spaceId>`.
4. DM-toegang gebruikt standaard koppeling. Onbekende afzenders ontvangen een koppelingscode; keur goed met:
   - `openclaw pairing approve googlechat <code>`
5. Groepsruimtes vereisen standaard een @-vermelding. Gebruik `botUser` als vermeldingsdetectie de gebruikersnaam van de app nodig heeft.

## Doelen

Gebruik deze identifiers voor aflevering en allowlists:

- Directe berichten: `users/<userId>` (aanbevolen).
- Ruwe e-mail `name@example.com` is veranderlijk en wordt alleen gebruikt voor directe allowlist-matching wanneer `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Verouderd: `users/<email>` wordt behandeld als een gebruikers-id, niet als een e-mailallowlist.
- Ruimtes: `spaces/<spaceId>`.

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
- Het standaardwebhookpad is `/googlechat` als `webhookPath` niet is ingesteld.
- `dangerouslyAllowNameMatching` schakelt veranderlijke e-mailprincipal-matching voor allowlists opnieuw in (compatibiliteitsmodus voor noodgevallen).
- Reacties zijn beschikbaar via de tool `reactions` en `channels action` wanneer `actions.reactions` is ingeschakeld.
- Berichtacties bieden `send` voor tekst en `upload-file` voor expliciete verzendingen van bijlagen. `upload-file` accepteert `media` / `filePath` / `path` plus optioneel `message`, `filename` en threadtargeting.
- `typingIndicator` ondersteunt `none`, `message` (standaard) en `reaction` (reactie vereist gebruikers-OAuth).
- Bijlagen worden via de Chat API gedownload en opgeslagen in de mediapipeline (grootte begrensd door `mediaMaxMb`).

Details over secrets-referenties: [Secretsbeheer](/nl/gateway/secrets).

## Problemen oplossen

### 405 Method Not Allowed

Als Google Cloud Logs Explorer fouten toont zoals:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Dit betekent dat de webhookhandler niet is geregistreerd. Veelvoorkomende oorzaken:

1. **Kanaal niet geconfigureerd**: de sectie `channels.googlechat` ontbreekt in je config. Controleer met:

   ```bash
   openclaw config get channels.googlechat
   ```

   Als dit "Config path not found" retourneert, voeg dan de configuratie toe (zie [Configuratiehoogtepunten](#config-highlights)).

2. **Plugin niet ingeschakeld**: controleer de pluginstatus:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Als dit "disabled" toont, voeg dan `plugins.entries.googlechat.enabled: true` toe aan je config.

3. **Gateway niet opnieuw gestart**: start de Gateway opnieuw nadat je config hebt toegevoegd:

   ```bash
   openclaw gateway restart
   ```

Controleer of het kanaal draait:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Andere problemen

- Controleer `openclaw channels status --probe` op authenticatiefouten of ontbrekende audience-configuratie.
- Als er geen berichten binnenkomen, bevestig dan de webhook-URL + eventabonnementen van de Chat-app.
- Als vermeldingsgating antwoorden blokkeert, stel `botUser` in op de gebruikersresourcenaam van de app en controleer `requireMention`.
- Gebruik `openclaw logs --follow` terwijl je een testbericht verzendt om te zien of verzoeken de Gateway bereiken.

Gerelateerde documentatie:

- [Gateway-configuratie](/nl/gateway/configuration)
- [Beveiliging](/nl/gateway/security)
- [Reacties](/nl/tools/reactions)

## Gerelateerd

- [Kanalenoverzicht](/nl/channels) — alle ondersteunde kanalen
- [Koppeling](/nl/channels/pairing) — DM-authenticatie en koppelingsflow
- [Groepen](/nl/channels/groups) — gedrag van groepschat en vermeldingsgating
- [Kanaalroutering](/nl/channels/channel-routing) — sessieroutering voor berichten
- [Beveiliging](/nl/gateway/security) — toegangsmodel en hardening
