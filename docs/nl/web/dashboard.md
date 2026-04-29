---
read_when:
    - Dashboardauthenticatie of blootstellingsmodi wijzigen
summary: Toegang en authenticatie voor het Gateway-dashboard (beheerinterface)
title: Overzichtspaneel
x-i18n:
    generated_at: "2026-04-29T23:28:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e0e7c8cebe715f96e7f0e967e9fd86c4c6c54f7cc08a4291b02515fc0933a1a
    source_path: web/dashboard.md
    workflow: 16
---

Het Gateway-dashboard is de browsergebaseerde Control UI die standaard op `/` wordt aangeboden
(overschrijf met `gateway.controlUi.basePath`).

Snel openen (lokale Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (of [http://localhost:18789/](http://localhost:18789/))
- Met `gateway.tls.enabled: true`, gebruik `https://127.0.0.1:18789/` en
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

Beveiligingsopmerking: de Control UI is een **beheeroppervlak** (chat, configuratie, exec-goedkeuringen).
Stel dit niet publiek beschikbaar. De UI bewaart dashboard-URL-tokens in sessionStorage
voor de huidige browsertabsessie en geselecteerde gateway-URL, en verwijdert ze uit de URL na het laden.
Geef de voorkeur aan localhost, Tailscale Serve of een SSH-tunnel.

## Snelle route (aanbevolen)

- Na onboarding opent de CLI het dashboard automatisch en drukt een schone (niet-getokeniseerde) link af.
- Opnieuw openen wanneer je wilt: `openclaw dashboard` (kopieert de link, opent de browser indien mogelijk, toont een SSH-hint bij headless gebruik).
- Als de UI om authenticatie met een gedeeld geheim vraagt, plak dan het geconfigureerde token of
  wachtwoord in de Control UI-instellingen.

## Basisprincipes van authenticatie (lokaal vs. extern)

- **Localhost**: open `http://127.0.0.1:18789/`.
- **Gateway TLS**: wanneer `gateway.tls.enabled: true`, gebruiken dashboard-/statuslinks
  `https://` en gebruiken Control UI-WebSocket-links `wss://`.
- **Bron van gedeeld-geheim-token**: `gateway.auth.token` (of
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` kan dit via een URL-fragment doorgeven
  voor eenmalige bootstrap, en de Control UI bewaart dit in sessionStorage voor de
  huidige browsertabsessie en geselecteerde gateway-URL in plaats van localStorage.
- Als `gateway.auth.token` door SecretRef wordt beheerd, drukt/kopieert/opent `openclaw dashboard`
  bewust een niet-getokeniseerde URL af. Dit voorkomt dat extern beheerde
  tokens zichtbaar worden in shell-logs, klembordgeschiedenis of browserstartargumenten.
- Als `gateway.auth.token` als SecretRef is geconfigureerd en niet is opgelost in je
  huidige shell, drukt `openclaw dashboard` nog steeds een niet-getokeniseerde URL af plus
  uitvoerbare richtlijnen voor het instellen van authenticatie.
- **Gedeeld-geheim-wachtwoord**: gebruik het geconfigureerde `gateway.auth.password` (of
  `OPENCLAW_GATEWAY_PASSWORD`). Het dashboard bewaart wachtwoorden niet tussen
  herlaadbeurten.
- **Modi met identiteit**: Tailscale Serve kan voldoen aan Control UI-/WebSocket-
  authenticatie via identiteitsheaders wanneer `gateway.auth.allowTailscale: true`, en een
  niet-loopback identity-aware reverse proxy kan voldoen aan
  `gateway.auth.mode: "trusted-proxy"`. In die modi heeft het dashboard geen
  geplakt gedeeld geheim nodig voor de WebSocket.
- **Niet localhost**: gebruik Tailscale Serve, een niet-loopback bind met gedeeld geheim, een
  niet-loopback identity-aware reverse proxy met
  `gateway.auth.mode: "trusted-proxy"`, of een SSH-tunnel. HTTP-API's gebruiken nog steeds
  authenticatie met gedeeld geheim, tenzij je bewust private-ingress
  `gateway.auth.mode: "none"` of trusted-proxy HTTP-authenticatie gebruikt. Zie
  [Weboppervlakken](/nl/web).

<a id="if-you-see-unauthorized-1008"></a>

## Als je "unauthorized" / 1008 ziet

- Zorg dat de gateway bereikbaar is (lokaal: `openclaw status`; extern: SSH-tunnel `ssh -N -L 18789:127.0.0.1:18789 user@host` en open daarna `http://127.0.0.1:18789/`).
- Voor `AUTH_TOKEN_MISMATCH` kunnen clients één vertrouwde nieuwe poging doen met een gecachet apparaattoken wanneer de gateway retry-hints retourneert. Die retry met gecachet token hergebruikt de gecachete goedgekeurde scopes van het token; aanroepers met expliciete `deviceToken` / expliciete `scopes` behouden hun aangevraagde scopeset. Als authenticatie na die retry nog steeds mislukt, los tokendrift dan handmatig op.
- Buiten dat retrypad is de prioriteit voor verbindingsauthenticatie eerst expliciet gedeeld token/wachtwoord, daarna expliciet `deviceToken`, daarna opgeslagen apparaattoken, daarna bootstrap-token.
- Op het asynchrone Tailscale Serve-pad voor de Control UI worden mislukte pogingen voor dezelfde
  `{scope, ip}` geserialiseerd voordat de failed-auth limiter ze registreert, waardoor
  de tweede gelijktijdige foute retry al `retry later` kan tonen.
- Volg voor stappen om tokendrift te herstellen de [checklist voor herstel van tokendrift](/nl/cli/devices#token-drift-recovery-checklist).
- Haal het gedeelde geheim op vanaf de gateway-host of lever het daar aan:
  - Token: `openclaw config get gateway.auth.token`
  - Wachtwoord: los de geconfigureerde `gateway.auth.password` of
    `OPENCLAW_GATEWAY_PASSWORD` op
  - Door SecretRef beheerd token: los de externe geheimenprovider op of exporteer
    `OPENCLAW_GATEWAY_TOKEN` in deze shell, en voer daarna `openclaw dashboard` opnieuw uit
  - Geen gedeeld geheim geconfigureerd: `openclaw doctor --generate-gateway-token`
- Plak in de dashboardinstellingen het token of wachtwoord in het authenticatieveld,
  en maak daarna verbinding.
- De taalkiezer van de UI staat in **Overzicht -> Gateway-toegang -> Taal**.
  Deze is onderdeel van de toegangskaart, niet van de sectie Uiterlijk.

## Gerelateerd

- [Control UI](/nl/web/control-ui)
- [WebChat](/nl/web/webchat)
