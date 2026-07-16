---
read_when:
    - Dashboardverificatie of blootstellingsmodi wijzigen
summary: Toegang tot en authenticatie voor het Gateway-dashboard (bedieningsinterface)
title: Dashboard
x-i18n:
    generated_at: "2026-07-16T16:32:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 34d7ab6c5f503f2dd3ab212a1fc6b47c84fcd47c5ad88aa9cdbbbbc73b7ef90e
    source_path: web/dashboard.md
    workflow: 16
---

Het Gateway-dashboard is de browsergebaseerde Control UI die standaard wordt aangeboden op `/` (overschrijf dit met `gateway.controlUi.basePath`).

Snel openen (lokale Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (of [http://localhost:18789/](http://localhost:18789/))
- Gebruik met `gateway.tls.enabled: true` `https://127.0.0.1:18789/` en `wss://127.0.0.1:18789` voor het WebSocket-eindpunt.

Belangrijke referenties:

- [Control UI](/nl/web/control-ui) voor gebruik en UI-mogelijkheden.
- [Tailscale](/nl/gateway/tailscale) voor automatisering van Serve/Funnel.
- [Weboppervlakken](/nl/web) voor bindmodi en beveiligingsinformatie.

Authenticatie wordt tijdens de WebSocket-handshake afgedwongen via het geconfigureerde authenticatiepad van de Gateway:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve-identiteitsheaders wanneer `gateway.auth.allowTailscale: true`
- identiteitsheaders van een vertrouwde proxy wanneer `gateway.auth.mode: "trusted-proxy"`

Zie `gateway.auth` in [Gateway-configuratie](/nl/gateway/configuration).

<Warning>
De Control UI is een **beheerdersoppervlak** (chat, configuratie, uitvoeringsgoedkeuringen). Stel dit niet openbaar beschikbaar. De UI bewaart tokens uit de dashboard-URL in sessionStorage voor het huidige browsertabblad en de geselecteerde Gateway-URL en verwijdert ze na het laden uit de URL. Gebruik bij voorkeur localhost, Tailscale Serve of een SSH-tunnel.
</Warning>

## Snelle methode (aanbevolen)

- Na de onboarding opent de CLI automatisch het dashboard en toont deze een schone link (zonder token).
- Open het op elk gewenst moment opnieuw: `openclaw dashboard` (kopieert de link, opent indien mogelijk een browser en toont een SSH-tip als er geen grafische omgeving is).
- Als zowel levering via het klembord als via de browser mislukt, toont `openclaw dashboard` nog steeds de schone URL en wordt aangegeven dat je jouw token (uit `OPENCLAW_GATEWAY_TOKEN` of `gateway.auth.token`) als URL-fragmentsleutel `token` moet toevoegen; de tokenwaarde wordt nooit in logboeken getoond.
- Als de UI om authenticatie met een gedeeld geheim vraagt, plak je het geconfigureerde token of wachtwoord in de instellingen van de Control UI.

## Basisprincipes van authenticatie (lokaal versus extern)

- **Localhost**: open `http://127.0.0.1:18789/`.
- **Gateway-TLS**: wanneer `gateway.tls.enabled: true`, gebruiken dashboard-/statuslinks `https://` en gebruiken WebSocket-links van de Control UI `wss://`.
- **Bron van het token voor het gedeelde geheim**: `gateway.auth.token` (of `OPENCLAW_GATEWAY_TOKEN`). `openclaw dashboard` kan dit voor een eenmalige bootstrap via het URL-fragment doorgeven; de Control UI bewaart het in sessionStorage voor het huidige tabblad en de geselecteerde Gateway-URL, niet in localStorage.
- Als `gateway.auth.token` door SecretRef wordt beheerd, toont/kopieert/opent `openclaw dashboard` bewust een URL zonder token, om te voorkomen dat extern beheerde tokens zichtbaar worden in shelllogboeken, de klembordgeschiedenis of argumenten voor het starten van de browser. Als de referentie in je huidige shell niet kan worden omgezet, wordt nog steeds de URL zonder token getoond, samen met praktische instructies voor het instellen van authenticatie.
- **Wachtwoord voor het gedeelde geheim**: gebruik de geconfigureerde `gateway.auth.password` (of `OPENCLAW_GATEWAY_PASSWORD`). Het dashboard bewaart wachtwoorden niet tussen herlaadbeurten.
- **Modi met identiteit**: Tailscale Serve voldoet via identiteitsheaders aan de authenticatievereisten van de Control UI/WebSocket wanneer `gateway.auth.allowTailscale: true`; een identiteitsbewuste reverse proxy die niet aan loopback is gebonden, voldoet aan `gateway.auth.mode: "trusted-proxy"`. Voor geen van beide hoeft een gedeeld geheim voor de WebSocket te worden geplakt.
- **Niet localhost**: gebruik Tailscale Serve, een niet aan loopback gebonden bind met een gedeeld geheim, een niet aan loopback gebonden identiteitsbewuste reverse proxy met `gateway.auth.mode: "trusted-proxy"`, of een SSH-tunnel. HTTP-API's gebruiken nog steeds authenticatie met een gedeeld geheim, tenzij je bewust private-ingress `gateway.auth.mode: "none"` of HTTP-authenticatie via een vertrouwde proxy gebruikt. Zie [Weboppervlakken](/nl/web).

## Openen in Telegram

Telegram-bots kunnen het dashboard met `/dashboard` als een Telegram Mini App openen.

Vereisten:

- `gateway.tailscale.mode: "serve"` of `"funnel"`, zodat Telegram een HTTPS-URL voor de Mini App ontvangt.
- De Telegram-afzender moet de eigenaar van de bot zijn: een numerieke Telegram-gebruikers-ID in `commands.ownerAllowFrom` of de effectieve `channels.telegram.allowFrom` van het geselecteerde account.
- Voer `/dashboard` uit in een privébericht met de bot. Aanroepen in groepen geven alleen aan dat je de opdracht in een privébericht moet openen en bevatten geen knop.
- Docker-installaties: voor de modi Serve/Funnel moet de Gateway naast `tailscaled` aan loopback worden gebonden, wat niet mogelijk is met bridge-netwerken met gepubliceerde poorten. Voer de Gateway-container uit met `network_mode: host` en koppel de `tailscaled`-socket van de host (`/var/run/tailscale`) plus de `tailscale`-CLI aan de container.

De Mini App voert een eenmalige overdracht van de eigenaar uit en leidt door naar de Control UI met een kortlevend bootstrap-token. Er wordt geen gedeeld Gateway-token in de URL weergegeven.

Geen doelen voor v1:

- De Telegram Web-iframe wordt niet ondersteund.
- Tailscale Serve/Funnel is het enige ondersteunde pad voor een gepubliceerde URL.

<a id="if-you-see-unauthorized-1008"></a>

## Als je 'unauthorized' / 1008 ziet

- Controleer of de Gateway bereikbaar is: lokaal `openclaw status`; extern, SSH-tunnel `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host` en open vervolgens `http://127.0.0.1:18789/`.
- Voor `AUTH_TOKEN_MISMATCH` mogen clients één vertrouwde nieuwe poging doen met een gecachet apparaattoken wanneer de Gateway aanwijzingen voor een nieuwe poging retourneert; die nieuwe poging hergebruikt de gecachete goedgekeurde bereiken van het token (expliciete aanroepers van `deviceToken`/`scopes` behouden hun aangevraagde reeks bereiken). Als authenticatie na die nieuwe poging nog steeds mislukt, los je tokenafwijking handmatig op.
- Voor `AUTH_SCOPE_MISMATCH` is het apparaattoken herkend, maar bevat het niet de aangevraagde bereiken; koppel het apparaat opnieuw of keur de nieuwe reeks bereiken goed in plaats van het gedeelde Gateway-token te roteren.
- Buiten dat pad voor een nieuwe poging is de prioriteitsvolgorde voor verbindingsauthenticatie: expliciet gedeeld token/wachtwoord, vervolgens expliciete `deviceToken`, vervolgens opgeslagen apparaattoken en daarna bootstrap-token.
- Op het asynchrone Tailscale Serve-pad worden mislukte pogingen voor dezelfde `{scope, ip}` geserialiseerd voordat de limietfunctie voor mislukte authenticatie ze registreert, waardoor een tweede gelijktijdige mislukte nieuwe poging al `retry later` kan tonen.
- Zie [Controlelijst voor herstel van tokenafwijking](/nl/cli/devices#token-drift-recovery-checklist) voor stappen om tokenafwijking te herstellen.
- Haal het gedeelde geheim op van de Gateway-host of verstrek het daar:
  - Token: `openclaw config get gateway.auth.token`
  - Wachtwoord: zet de geconfigureerde `gateway.auth.password` of `OPENCLAW_GATEWAY_PASSWORD` om
  - Door SecretRef beheerd token: zet de externe provider van geheimen om, of exporteer `OPENCLAW_GATEWAY_TOKEN` in deze shell en voer `openclaw dashboard` opnieuw uit
  - Geen gedeeld geheim geconfigureerd: `openclaw doctor --generate-gateway-token`
- Plak in de dashboardinstellingen het token of wachtwoord in het authenticatieveld en maak vervolgens verbinding.
- De taalkeuze van de UI staat onder **Settings -> General -> Language**, niet onder Appearance.

## Gerelateerd

- [Control UI](/nl/web/control-ui)
- [WebChat](/nl/web/webchat)
