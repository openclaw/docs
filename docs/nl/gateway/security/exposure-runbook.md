---
read_when:
    - De Gateway beschikbaar maken via LAN, tailnet, Tailscale Serve, Funnel of een reverse proxy
    - Een implementatie beoordelen voordat echte berichtengebruikers worden toegelaten
    - Een risicovolle configuratie voor externe toegang of privéberichten terugdraaien
sidebarTitle: Exposure runbook
summary: Checklist voor controles vooraf en terugdraaien voordat een OpenClaw Gateway buiten local loopback toegankelijk wordt gemaakt
title: Runbook voor Gateway-blootstelling
x-i18n:
    generated_at: "2026-07-12T08:57:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fb8e66af57e804325afc91281122b822183337177c734efe065c5fc18b175e72
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
Stel de Gateway pas bloot nadat u kunt uitleggen wie deze kan bereiken, hoe diegene wordt
geverifieerd, welke agents diegene kan activeren en welke tools die agents kunnen
gebruiken. Ga bij twijfel terug naar uitsluitend local loopback-toegang en voer de audit opnieuw uit.
</Warning>

Dit draaiboek zet de bredere richtlijnen voor [Beveiliging](/nl/gateway/security) om in een
controlelijst voor beheerders voor externe toegang en blootstelling via berichtenkanalen.

## Het blootstellingspatroon kiezen

Geef de voorkeur aan het meest beperkte patroon dat aan de workflow voldoet.

| Patroon                    | Aanbevolen wanneer                                | Vereiste beheersmaatregelen                                                                                                               |
| -------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Local loopback + SSH-tunnel      | Persoonlijk gebruik, beheerderstoegang, foutopsporing | Behoud `gateway.bind: "loopback"` en tunnel `127.0.0.1:18789`                                                                              |
| Local loopback + Tailscale Serve | Persoonlijke tailnet-toegang tot de Control UI/WebSocket | Houd de Gateway uitsluitend op local loopback; Tailscale-identiteitsheaders verifiëren alleen het WebSocket-oppervlak van de Control UI, niet andere verificatiepaden |
| Tailnet-/LAN-binding       | Afgeschermd privénetwerk met bekende apparaten     | Gateway-verificatie, firewall-toelatingslijst, geen openbare poortdoorsturing                                                              |
| Vertrouwde reverse proxy   | SSO/OIDC van de organisatie vóór de Gateway        | `trusted-proxy`-verificatie, strikte `trustedProxies`, regels voor het overschrijven/verwijderen van headers, expliciet toegestane gebruikers |
| Openbaar internet          | Zeldzame implementaties met een hoog risico        | Identiteitsbewuste proxy, TLS, frequentielimieten, strikte toelatingslijsten, gesandboxte niet-hoofdsessies                                |

Vermijd rechtstreekse openbare poortdoorsturing naar de Gateway. Als openbare toegang
vereist is, plaatst u er een identiteitsbewuste proxy voor en maakt u de proxy het
enige netwerkpad naar de Gateway.

## Inventarisatie vooraf

Leg het volgende vast voordat u het bindings-, proxy-, Tailscale- of kanaalbeleid wijzigt:

- Gateway-host, OS-gebruiker en statusmap (standaard `~/.openclaw`).
- Gateway-URL en bindingsmodus (`gateway.bind`; standaardpoort `18789`).
- Verificatiemodus, bron van token/wachtwoord of identiteitsbron van de vertrouwde proxy.
- Elk ingeschakeld kanaal en of het privéberichten, groepen of webhooks accepteert.
- Agents die bereikbaar zijn voor niet-lokale afzenders.
- Toolprofiel, sandboxmodus en beleid voor tools met verhoogde bevoegdheden voor elke bereikbare agent.
- Externe aanmeldgegevens die voor die agents beschikbaar zijn.
- Back-uplocatie voor `~/.openclaw/openclaw.json` en aanmeldgegevens.

Als meer dan één persoon de bot berichten kan sturen, behandelt u dit als gedeelde, gedelegeerde
toolbevoegdheid en niet als hostisolatie per gebruiker.

## Basiscontroles

Voer deze uit voordat u toegang opent:

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

Los eerst kritieke bevindingen op. Accepteer waarschuwingen alleen wanneer deze bewust zijn
en voor de implementatie zijn gedocumenteerd. Zie [Controles van de beveiligingsaudit](/nl/gateway/security/audit-checks)
voor de betekenis van elke `checkId` en de bijbehorende reparatiesleutel.

Geef voor externe CLI-validatie de aanmeldgegevens expliciet door:

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

Ga er niet van uit dat aanmeldgegevens uit de lokale configuratie van toepassing zijn op een expliciete externe URL.

## Minimale veilige basisconfiguratie

Gebruik deze structuur als uitgangspunt voor blootgestelde implementaties:

```json5
{
  gateway: {
    bind: "loopback",
    auth: {
      mode: "token",
      token: "replace-with-a-long-random-token",
    },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  agents: {
    defaults: {
      sandbox: { mode: "non-main" },
    },
  },
  tools: {
    profile: "messaging",
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

Verruim steeds één beheersmaatregel tegelijk: voeg een specifieke toelatingslijst voor een kanaal toe voordat u
tools met schrijfmogelijkheden inschakelt, of schakel een reverse proxy in voordat u extern
Control UI-verkeer accepteert.

`tools.exec.security: "deny"` blokkeert alle exec-aanroepen, inclusief onschuldige
diagnostiek. Als diagnostiek of opdrachten met een laag risico vereist zijn, versoepelt u dit pas
nadat u de specifieke afzenders, agents, opdrachten en goedkeuringsmodus hebt gekozen die
bij uw dreigingsmodel passen.

## Blootstelling van privéberichten en groepen

Berichtenkanalen zijn invoeroppervlakken die niet worden vertrouwd. Voordat u privéberichten of
groepen toestaat:

- Geef de voorkeur aan `dmPolicy: "pairing"` of een strikte `allowFrom`-lijst boven `dmPolicy: "open"`.
- Combineer toelatingslijsten met `"*"` niet met ruime tooltoegang.
- Vereis vermeldingen in groepen, tenzij de ruimte streng wordt beheerd.
- Stel `session.dmScope: "per-channel-peer"` in (of `"per-account-channel-peer"` voor
  kanalen met meerdere accounts) wanneer meerdere personen de bot privéberichten kunnen sturen, zodat privéberichtensessies
  geen context delen.
- Leid gedeelde kanalen naar agents met minimale tools en zonder persoonlijke
  aanmeldgegevens.

Koppeling geeft de afzender toestemming om de bot te activeren. Hierdoor wordt die afzender geen
afzonderlijke beveiligingsgrens voor de host.

## Controles voor de reverse proxy

Voor identiteitsbewuste proxy's:

- De proxy moet gebruikers verifiëren voordat verkeer naar de Gateway wordt doorgestuurd.
- De firewall of het netwerkbeleid moet rechtstreekse toegang tot de Gateway-poort blokkeren.
- `gateway.trustedProxies` mag alleen de bron-IP-adressen van de proxy bevatten.
- De proxy moet door clients aangeleverde identiteits- en doorstuurheaders verwijderen of
  overschrijven.
- Stel `gateway.auth.trustedProxy.allowUsers` in wanneer de proxy meer dan
  één doelgroep bedient.
- Gebruik `gateway.auth.trustedProxy.allowLoopback` alleen voor een proxy op dezelfde host
  waarbij lokale processen worden vertrouwd en de proxy eigenaar is van de identiteitsheaders.

Voer `openclaw security audit --deep` uit na wijzigingen aan de proxy. Bevindingen voor vertrouwde proxy's
zijn zeer betekenisvol, omdat de proxy de verificatiegrens
wordt.

## Beoordeling van tools en sandbox

Voordat u een agent blootstelt aan externe afzenders:

- Controleer welke sessies op de host en welke in de sandbox worden uitgevoerd.
- Weiger uitvoering op de host of vereis daarvoor goedkeuring.
- Houd tools met verhoogde bevoegdheden uitgeschakeld, tenzij een specifieke, vertrouwde afzender deze nodig heeft.
- Vermijd browser-, canvas-, Node-, Cron-, Gateway- en tools voor het aanmaken van sessies voor open
  of gedeeltelijk open berichtenoppervlakken.
- Houd bindingskoppelingen beperkt; vermijd paden naar aanmeldgegevens, thuismappen, Docker-sockets en
  systeempaden.
- Gebruik afzonderlijke gateways, OS-gebruikers of hosts voor wezenlijk verschillende vertrouwensgrenzen.

Als externe gebruikers niet volledig worden vertrouwd, moet isolatie voortkomen uit afzonderlijke
implementaties en niet alleen uit prompts of sessielabels.

## Validatie na wijzigingen

Na elke wijziging in de blootstelling:

1. Voer `openclaw security audit --deep` opnieuw uit.
2. Controleer of een geautoriseerde verbinding tot stand kan worden gebracht.
3. Controleer of een niet-geautoriseerde afzender of browsersessie wordt geweigerd.
4. Controleer of geheimen in logboeken worden afgeschermd.
5. Controleer of de routering van privéberichten/groepen alleen de beoogde agent bereikt.
6. Controleer of tools met grote gevolgen om goedkeuring vragen of worden geweigerd.
7. Documenteer de geaccepteerde resterende waarschuwingen.

Ga niet verder met de volgende wijziging in de blootstelling voordat u de huidige
begrijpt.

## Terugdraaiplan

Als de Gateway mogelijk te ruim is blootgesteld:

```json5
{
  gateway: {
    bind: "loopback",
  },
  channels: {
    whatsapp: { dmPolicy: "disabled" },
    telegram: { dmPolicy: "disabled" },
    discord: { dmPolicy: "disabled" },
    slack: { dmPolicy: "disabled" },
  },
  tools: {
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

Vervolgens:

1. Stop openbare doorsturing, Tailscale Funnel of routes van de reverse proxy.
2. Vervang Gateway-tokens/wachtwoorden en getroffen aanmeldgegevens voor integraties.
3. Verwijder `"*"` en onverwachte afzenders uit toelatingslijsten.
4. Controleer recente auditlogboeken, uitvoeringsgeschiedenis, toolaanroepen en configuratiewijzigingen.
5. Voer `openclaw security audit --deep` opnieuw uit.
6. Schakel toegang opnieuw in met het meest beperkte patroon dat aan de workflow voldoet.

## Controlelijst voor beoordeling

- De Gateway blijft uitsluitend via local loopback bereikbaar, tenzij er een gedocumenteerde reden is.
- Niet-local loopback-toegang heeft verificatie en firewallbescherming, zonder rechtstreekse openbare route.
- Implementaties met een vertrouwde proxy hebben strikte proxy-IP-adressen en beheer van headers.
- Privéberichten gebruiken standaard koppeling of toelatingslijsten, geen open toegang.
- Groepen vereisen vermeldingen of expliciete toelatingslijsten.
- Gedeelde kanalen hebben geen toegang tot persoonlijke aanmeldgegevens.
- Niet-hoofdsessies worden in sandboxmodus uitgevoerd.
- Uitvoering op de host en tools met verhoogde bevoegdheden worden geweigerd of vereisen goedkeuring.
- Geheimen worden in logboeken afgeschermd.
- Kritieke auditbevindingen zijn opgelost.
- Stappen voor terugdraaien zijn getest en gedocumenteerd.
