---
read_when:
    - Dashboardauthenticatie of blootstellingsmodi wijzigen
summary: Toegang en authenticatie voor Gateway-dashboard (beheer-UI)
title: Dashboard
x-i18n:
    generated_at: "2026-05-11T20:56:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 07e11c1f71e6691ee053192e238a3b48568f81c3180e6b5f8e21b6874417e57e
    source_path: web/dashboard.md
    workflow: 16
    postprocess_version: locale-links-v1
---

De Gateway-dashboard is de browser-Control UI die standaard op `/` wordt aangeboden
(overschrijf met `gateway.controlUi.basePath`).

Snel openen (lokale Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (of [http://localhost:18789/](http://localhost:18789/))
- Gebruik met `gateway.tls.enabled: true` `https://127.0.0.1:18789/` en
  `wss://127.0.0.1:18789` voor het WebSocket-eindpunt.

Belangrijke referenties:

- [Control UI](/nl/web/control-ui) voor gebruik en UI-mogelijkheden.
- [Tailscale](/nl/gateway/tailscale) voor Serve/Funnel-automatisering.
- [Weboppervlakken](/nl/web) voor bind-modi en beveiligingsopmerkingen.

Authenticatie wordt afgedwongen tijdens de WebSocket-handshake via het geconfigureerde Gateway-authenticatiepad:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve-identiteitsheaders wanneer `gateway.auth.allowTailscale: true`
- trusted-proxy-identiteitsheaders wanneer `gateway.auth.mode: "trusted-proxy"`

Zie `gateway.auth` in [Gateway-configuratie](/nl/gateway/configuration).

Beveiligingsopmerking: de Control UI is een **beheerdersoppervlak** (chat, config, exec-goedkeuringen).
Stel deze niet publiekelijk bloot. De UI bewaart dashboard-URL-tokens in sessionStorage
voor de huidige browsertabsessie en geselecteerde Gateway-URL, en verwijdert ze na het laden uit de URL.
Gebruik bij voorkeur localhost, Tailscale Serve of een SSH-tunnel.

## Snelle route (aanbevolen)

- Na de onboarding opent de CLI automatisch het dashboard en toont deze een schone link (zonder token).
- Op elk moment opnieuw openen: `openclaw dashboard` (kopieert de link, opent indien mogelijk de browser, toont een SSH-hint bij headless gebruik).
- Als levering via klembord en browser mislukt, toont `openclaw dashboard` nog steeds de
  schone URL en meldt dat je het token uit `OPENCLAW_GATEWAY_TOKEN` of
  `gateway.auth.token` moet gebruiken als de URL-fragmentsleutel `token`; tokenwaarden worden niet in logs getoond.
- Als de UI om gedeeld-geheim-authenticatie vraagt, plak dan het geconfigureerde token of
  wachtwoord in de Control UI-instellingen.

## Basisprincipes van authenticatie (lokaal versus extern)

- **Localhost**: open `http://127.0.0.1:18789/`.
- **Gateway TLS**: wanneer `gateway.tls.enabled: true`, gebruiken dashboard-/statuslinks
  `https://` en gebruiken Control UI-WebSocket-links `wss://`.
- **Bron voor gedeeld-geheim-token**: `gateway.auth.token` (of
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` kan dit via een URL-fragment doorgeven
  voor eenmalige bootstrap, en de Control UI bewaart het in sessionStorage voor de
  huidige browsertabsessie en geselecteerde Gateway-URL in plaats van in localStorage.
- Als `gateway.auth.token` door SecretRef wordt beheerd, toont/kopieert/opent
  `openclaw dashboard` bewust een URL zonder token. Dit voorkomt blootstelling van
  extern beheerde tokens in shell-logs, klembordgeschiedenis of browserstartargumenten.
- Als `gateway.auth.token` is geconfigureerd als SecretRef en niet is opgelost in je
  huidige shell, toont `openclaw dashboard` nog steeds een URL zonder token plus
  bruikbare instructies voor authenticatie-instelling.
- **Gedeeld-geheim-wachtwoord**: gebruik het geconfigureerde `gateway.auth.password` (of
  `OPENCLAW_GATEWAY_PASSWORD`). Het dashboard bewaart wachtwoorden niet tussen
  herladingen.
- **Modi met identiteit**: Tailscale Serve kan Control UI-/WebSocket-authenticatie
  afhandelen via identiteitsheaders wanneer `gateway.auth.allowTailscale: true`, en een
  niet-loopback reverse proxy met identiteitsbewustzijn kan
  `gateway.auth.mode: "trusted-proxy"` afhandelen. In die modi heeft het dashboard geen
  geplakt gedeeld geheim nodig voor de WebSocket.
- **Niet localhost**: gebruik Tailscale Serve, een niet-loopback bind met gedeeld geheim, een
  niet-loopback reverse proxy met identiteitsbewustzijn en
  `gateway.auth.mode: "trusted-proxy"`, of een SSH-tunnel. HTTP-API's gebruiken nog steeds
  gedeeld-geheim-authenticatie tenzij je bewust private-ingress
  `gateway.auth.mode: "none"` of trusted-proxy HTTP-authenticatie gebruikt. Zie
  [Weboppervlakken](/nl/web).

<a id="if-you-see-unauthorized-1008"></a>

## Als je "unauthorized" / 1008 ziet

- Zorg dat de Gateway bereikbaar is (lokaal: `openclaw status`; extern: SSH-tunnel `ssh -N -L 18789:127.0.0.1:18789 user@host` en open daarna `http://127.0.0.1:18789/`).
- Voor `AUTH_TOKEN_MISMATCH` mogen clients één vertrouwde retry uitvoeren met een gecachet apparaattoken wanneer de Gateway retry-hints teruggeeft. Die retry met gecachet token hergebruikt de gecachete goedgekeurde scopes van het token; aanroepers met expliciete `deviceToken` / expliciete `scopes` behouden hun aangevraagde scopeset. Als authenticatie na die retry nog steeds mislukt, los tokendrift dan handmatig op.
- Voor `AUTH_SCOPE_MISMATCH` werd het apparaattoken herkend, maar bevat het niet de door het dashboard aangevraagde scopes; koppel opnieuw of keur het aangevraagde scopecontract goed in plaats van het gedeelde Gateway-token te roteren.
- Buiten dat retrypad is de prioriteit voor verbindingsauthenticatie eerst expliciet gedeeld token/wachtwoord, daarna expliciete `deviceToken`, daarna opgeslagen apparaattoken, daarna bootstrap-token.
- Op het asynchrone Tailscale Serve Control UI-pad worden mislukte pogingen voor dezelfde
  `{scope, ip}` geserialiseerd voordat de failed-auth-limiter ze registreert, waardoor
  de tweede gelijktijdige slechte retry al `retry later` kan tonen.
- Volg voor stappen om tokendrift te herstellen de [checklist voor herstel van tokendrift](/nl/cli/devices#token-drift-recovery-checklist).
- Haal het gedeelde geheim op van de Gateway-host of geef het daar op:
  - Token: `openclaw config get gateway.auth.token`
  - Wachtwoord: los het geconfigureerde `gateway.auth.password` op of
    `OPENCLAW_GATEWAY_PASSWORD`
  - Door SecretRef beheerd token: los de externe geheime-provider op of exporteer
    `OPENCLAW_GATEWAY_TOKEN` in deze shell, en voer daarna `openclaw dashboard` opnieuw uit
  - Geen gedeeld geheim geconfigureerd: `openclaw doctor --generate-gateway-token`
- Plak in de dashboardinstellingen het token of wachtwoord in het authenticatieveld,
  en maak daarna verbinding.
- De taalkeuze van de UI staat in **Overview -> Gateway Access -> Language**.
  Deze is onderdeel van de toegangskaart, niet van de sectie Appearance.

## Gerelateerd

- [Control UI](/nl/web/control-ui)
- [WebChat](/nl/web/webchat)
