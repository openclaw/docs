---
read_when:
    - Dashboardauthenticatie of blootstellingsmodi wijzigen
summary: Gateway-dashboard (Control UI) toegang en authenticatie
title: Dashboard
x-i18n:
    generated_at: "2026-05-05T01:51:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e2086587fee6303221663748c3047886a5beae29862d66e2edf78e02bfe3da1
    source_path: web/dashboard.md
    workflow: 16
---

Het Gateway-dashboard is de Control UI in de browser die standaard op `/` wordt aangeboden
(overschrijf dit met `gateway.controlUi.basePath`).

Snel openen (lokale Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (of [http://localhost:18789/](http://localhost:18789/))
- Met `gateway.tls.enabled: true` gebruik je `https://127.0.0.1:18789/` en
  `wss://127.0.0.1:18789` voor het WebSocket-eindpunt.

Belangrijke verwijzingen:

- [Control UI](/nl/web/control-ui) voor gebruik en UI-mogelijkheden.
- [Tailscale](/nl/gateway/tailscale) voor Serve/Funnel-automatisering.
- [Weboppervlakken](/nl/web) voor bind-modi en beveiligingsopmerkingen.

Authenticatie wordt afgedwongen tijdens de WebSocket-handshake via het geconfigureerde gateway-
authenticatiepad:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve-identiteitsheaders wanneer `gateway.auth.allowTailscale: true`
- trusted-proxy-identiteitsheaders wanneer `gateway.auth.mode: "trusted-proxy"`

Zie `gateway.auth` in [Gateway-configuratie](/nl/gateway/configuration).

Beveiligingsopmerking: de Control UI is een **beheeroppervlak** (chat, configuratie, uitvoeringsgoedkeuringen).
Stel dit niet publiek beschikbaar. De UI bewaart dashboard-URL-tokens in sessionStorage
voor de huidige browsertabsessie en geselecteerde gateway-URL, en verwijdert ze na het laden uit de URL.
Geef de voorkeur aan localhost, Tailscale Serve of een SSH-tunnel.

## Snelste route (aanbevolen)

- Na onboarding opent de CLI het dashboard automatisch en toont een schone link (zonder token).
- Opnieuw openen kan altijd: `openclaw dashboard` (kopieert de link, opent indien mogelijk de browser, toont een SSH-hint bij headless gebruik).
- Als leveren via klembord en browser mislukt, toont `openclaw dashboard` nog steeds de
  schone URL en meldt dat je het token uit `OPENCLAW_GATEWAY_TOKEN` of
  `gateway.auth.token` moet gebruiken als URL-fragmentsleutel `token`; tokenwaarden worden niet in logs afgedrukt.
- Als de UI om gedeelde-geheim-authenticatie vraagt, plak je het geconfigureerde token of
  wachtwoord in de Control UI-instellingen.

## Basisprincipes van authenticatie (lokaal versus extern)

- **Localhost**: open `http://127.0.0.1:18789/`.
- **Gateway TLS**: wanneer `gateway.tls.enabled: true`, gebruiken dashboard-/statuslinks
  `https://` en gebruiken Control UI WebSocket-links `wss://`.
- **Bron voor gedeeld-geheim-token**: `gateway.auth.token` (of
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` kan dit via een URL-fragment doorgeven
  voor een eenmalige bootstrap, en de Control UI bewaart het in sessionStorage voor de
  huidige browsertabsessie en geselecteerde gateway-URL in plaats van localStorage.
- Als `gateway.auth.token` door SecretRef wordt beheerd, drukt/kopieert/opent
  `openclaw dashboard` bewust een URL zonder token af. Dit voorkomt dat
  extern beheerde tokens in shell-logs, klembordgeschiedenis of browserstartargumenten terechtkomen.
- Als `gateway.auth.token` als SecretRef is geconfigureerd en in je
  huidige shell niet is opgelost, toont `openclaw dashboard` nog steeds een URL zonder token plus
  uitvoerbare richtlijnen voor authenticatie-instelling.
- **Gedeeld-geheim-wachtwoord**: gebruik het geconfigureerde `gateway.auth.password` (of
  `OPENCLAW_GATEWAY_PASSWORD`). Het dashboard bewaart wachtwoorden niet tussen
  herlaadbeurten.
- **Modi met identiteit**: Tailscale Serve kan Control UI/WebSocket-
  authenticatie afhandelen via identiteitsheaders wanneer `gateway.auth.allowTailscale: true`, en een
  niet-loopback identiteitsbewuste reverse proxy kan voldoen aan
  `gateway.auth.mode: "trusted-proxy"`. In die modi heeft het dashboard geen
  geplakt gedeeld geheim nodig voor de WebSocket.
- **Niet localhost**: gebruik Tailscale Serve, een niet-loopback bind met gedeeld geheim, een
  niet-loopback identiteitsbewuste reverse proxy met
  `gateway.auth.mode: "trusted-proxy"`, of een SSH-tunnel. HTTP-API's gebruiken nog steeds
  gedeeld-geheim-authenticatie, tenzij je bewust private-ingress
  `gateway.auth.mode: "none"` of trusted-proxy HTTP-authenticatie gebruikt. Zie
  [Weboppervlakken](/nl/web).

<a id="if-you-see-unauthorized-1008"></a>

## Als je "unauthorized" / 1008 ziet

- Zorg dat de gateway bereikbaar is (lokaal: `openclaw status`; extern: SSH-tunnel `ssh -N -L 18789:127.0.0.1:18789 user@host` en open daarna `http://127.0.0.1:18789/`).
- Voor `AUTH_TOKEN_MISMATCH` mogen clients één vertrouwde nieuwe poging doen met een gecachet apparaattoken wanneer de gateway retry-hints teruggeeft. Die nieuwe poging met gecachet token hergebruikt de gecachete goedgekeurde scopes van het token; aanroepen met expliciete `deviceToken` / expliciete `scopes` behouden hun gevraagde scopeset. Als authenticatie na die nieuwe poging nog steeds mislukt, los je tokendrift handmatig op.
- Buiten dat pad voor opnieuw proberen is de prioriteit voor verbindingsauthenticatie eerst expliciet gedeeld token/wachtwoord, daarna expliciete `deviceToken`, daarna opgeslagen apparaattoken, daarna bootstraptoken.
- Op het async Tailscale Serve Control UI-pad worden mislukte pogingen voor dezelfde
  `{scope, ip}` geserialiseerd voordat de failed-auth-limiter ze registreert, waardoor
  de tweede gelijktijdige slechte nieuwe poging al `retry later` kan tonen.
- Volg voor stappen voor herstel van tokendrift de [checklist voor herstel van tokendrift](/nl/cli/devices#token-drift-recovery-checklist).
- Haal het gedeelde geheim op vanaf de gateway-host of lever het daar aan:
  - Token: `openclaw config get gateway.auth.token`
  - Wachtwoord: los het geconfigureerde `gateway.auth.password` of
    `OPENCLAW_GATEWAY_PASSWORD` op
  - Door SecretRef beheerd token: los de externe geheimprovider op of exporteer
    `OPENCLAW_GATEWAY_TOKEN` in deze shell, en voer daarna `openclaw dashboard` opnieuw uit
  - Geen gedeeld geheim geconfigureerd: `openclaw doctor --generate-gateway-token`
- Plak in de dashboardinstellingen het token of wachtwoord in het authenticatieveld,
  en maak daarna verbinding.
- De taalkeuze van de UI staat in **Overzicht -> Gateway-toegang -> Taal**.
  Dit is onderdeel van de toegangskaart, niet van de sectie Vormgeving.

## Gerelateerd

- [Control UI](/nl/web/control-ui)
- [WebChat](/nl/web/webchat)
