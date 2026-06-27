---
read_when:
    - De Gateway beschikbaar maken via LAN, tailnet, Tailscale Serve, Funnel of een reverse proxy
    - Een implementatie beoordelen voordat echte berichtengebruikers worden toegelaten
    - Een risicovolle configuratie voor externe toegang of DM terugdraaien
sidebarTitle: Exposure runbook
summary: Preflight- en rollbackchecklist voordat je een OpenClaw Gateway buiten loopback beschikbaar maakt
title: Gateway-blootstelling-runbook
x-i18n:
    generated_at: "2026-06-27T17:37:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c5e94cc03b9d79a03eb16aa04bad0fd311b72f27f14182c036832382dbce3d0f
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
Stel de Gateway pas bloot nadat u kunt uitleggen wie deze kan bereiken, hoe zij worden
geverifieerd, welke agents zij kunnen activeren en welke tools die agents kunnen
gebruiken. Ga bij twijfel terug naar alleen-loopbacktoegang en voer de audit opnieuw uit.
</Warning>

Dit runbook zet de bredere richtlijnen voor [Beveiliging](/nl/gateway/security) om in een
operatorchecklist voor externe toegang en blootstelling via berichten.

## Kies het blootstellingspatroon

Geef de voorkeur aan het smalste patroon dat aan de workflow voldoet.

| Patroon                    | Aanbevolen wanneer                            | Vereiste controles                                                                                  |
| -------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Loopback + SSH-tunnel      | Persoonlijk gebruik, beheerderstoegang, debuggen | Houd `gateway.bind: "loopback"` aan en tunnel `127.0.0.1:18789`                                      |
| Loopback + Tailscale Serve | Persoonlijke tailnettoegang tot Control UI/WebSocket | Houd Gateway alleen-loopback; vertrouw alleen op Tailscale-identiteitsheaders voor ondersteunde oppervlakken |
| Tailnet/LAN-bind           | Toegewijd privénetwerk met bekende apparaten  | Gateway-authenticatie, firewall-allowlist, geen openbare port-forward                               |
| Vertrouwde reverse proxy   | Organisatie-SSO/OIDC vóór Gateway             | `trusted-proxy`-authenticatie, strikte `trustedProxies`, regels voor overschrijven/strippen van headers, expliciet toegestane gebruikers |
| Openbaar internet          | Zeldzame implementaties met hoog risico       | Identiteitsbewuste proxy, TLS, snelheidslimieten, strikte allowlists, gesandboxte niet-main-sessies  |

Vermijd directe openbare port-forwarding naar de Gateway. Als u openbare toegang nodig hebt,
plaats er dan een identiteitsbewuste proxy vóór en maak de proxy het enige netwerkpad
naar de Gateway.

## Pre-flight-inventaris

Leg dit vast voordat u bind-, proxy-, Tailscale- of kanaalbeleid wijzigt:

- Gateway-host, OS-gebruiker en statusdirectory.
- Gateway-URL en bind-modus.
- Authenticatiemodus, token-/wachtwoordbron of identiteitsbron van de vertrouwde proxy.
- Alle ingeschakelde kanalen en of ze DM's, groepen of webhooks accepteren.
- Agents die bereikbaar zijn voor niet-lokale afzenders.
- Toolprofiel, sandboxmodus en beleid voor verhoogde tools voor elke bereikbare agent.
- Externe referenties die beschikbaar zijn voor die agents.
- Back-uplocatie voor `~/.openclaw/openclaw.json` en referenties.

Als meer dan één persoon de bot berichten kan sturen, behandel dit dan als gedeelde
gedelegeerde toolbevoegdheid, niet als hostisolatie per gebruiker.

## Basiscontroles

Voer deze uit voordat u toegang opent:

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

Los kritieke bevindingen eerst op. Waarschuwingen zijn alleen acceptabel wanneer ze
bedoeld zijn en voor de implementatie zijn gedocumenteerd.

Geef voor externe CLI-validatie expliciet referenties mee:

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

Ga er niet van uit dat lokale configuratiereferenties gelden voor een expliciete externe URL.

## Minimale veilige basis

Gebruik deze vorm als startpunt voor blootgestelde implementaties:

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

Verbreed daarna één controle tegelijk. Voeg bijvoorbeeld een specifieke kanaal-allowlist toe
voordat u tools met schrijfmogelijkheden inschakelt, of schakel een reverse proxy in voordat u
extern Control UI-verkeer accepteert.

De strikte basis `exec.security: "deny"` blokkeert alle exec-aanroepen, inclusief
onschadelijke diagnostiek. Als diagnostiek of opdrachten met laag risico vereist zijn, versoepel dit
dan pas nadat u de specifieke afzenders, agents, opdrachten en goedkeuringsmodus hebt gekozen
die bij uw dreigingsmodel passen.

## Blootstelling van DM's en groepen

Berichtenkanalen zijn niet-vertrouwde invoeroppervlakken. Voordat u DM's of groepen toestaat:

- Geef de voorkeur aan `dmPolicy: "pairing"` of strikte `allowFrom`-lijsten.
- Vermijd `dmPolicy: "open"` tenzij elke afzender vertrouwd is.
- Combineer `"*"`-allowlists niet met brede tooltoegang.
- Vereis vermeldingen in groepen, tenzij de ruimte streng wordt beheerd.
- Gebruik `session.dmScope: "per-channel-peer"` wanneer meerdere mensen de bot een DM kunnen sturen.
- Route gedeelde kanalen naar agents met minimale tools en zonder persoonlijke referenties.

Koppeling keurt de afzender goed om de bot te activeren. Het maakt die afzender geen
afzonderlijke beveiligingsgrens voor de host.

## Controles voor reverse proxy

Voor identiteitsbewuste proxy's:

- De proxy moet gebruikers verifiëren voordat naar de Gateway wordt doorgestuurd.
- Directe toegang tot de Gateway-poort moet worden geblokkeerd door firewall- of netwerkbeleid.
- `gateway.trustedProxies` mag alleen de bron-IP's van de proxy bevatten.
- De proxy moet door clients aangeleverde identiteits- en forwardingheaders strippen of overschrijven.
- `gateway.auth.trustedProxy.allowUsers` moet verwachte gebruikers vermelden wanneer de proxy meer dan één doelgroep bedient.
- Loopback-proxymodus op dezelfde host mag `allowLoopback` alleen gebruiken wanneer lokale processen vertrouwd zijn en de proxy eigenaar is van de identiteitsheaders.

Voer `openclaw security audit --deep` uit na proxywijzigingen. Bevindingen voor trusted-proxy
hebben bewust een hoog signaalgehalte, omdat de proxy de authenticatiegrens wordt.

## Review van tools en sandbox

Voordat u een agent blootstelt aan externe afzenders:

- Bevestig welke sessies op de host versus in de sandbox draaien.
- Weiger host-exec of vereis goedkeuring.
- Houd verhoogde tools uitgeschakeld tenzij een specifieke, vertrouwde afzender ze nodig heeft.
- Vermijd browser-, canvas-, node-, cron-, gateway- en session-spawn-tools voor open of halfopen berichtenoppervlakken.
- Houd bind mounts smal en vermijd referentie-, home-, Docker-socket- en systeempaden.
- Gebruik afzonderlijke gateways, OS-gebruikers of hosts voor wezenlijk verschillende vertrouwensgrenzen.

Als externe gebruikers niet volledig vertrouwd zijn, moet isolatie uit afzonderlijke
implementaties komen, niet alleen uit prompts of sessielabels.

## Validatie na wijziging

Na elke blootstellingswijziging:

1. Voer `openclaw security audit --deep` opnieuw uit.
2. Test een succesvolle geautoriseerde verbinding.
3. Test dat een ongeautoriseerde afzender of browsersessie wordt geweigerd.
4. Bevestig dat logs geheimen redigeren.
5. Bevestig dat DM-/groepsroutering alleen de bedoelde agent bereikt.
6. Bevestig dat tools met hoge impact om goedkeuring vragen of worden geweigerd.
7. Documenteer de geaccepteerde resterende waarschuwingen.

Ga niet door naar de volgende blootstellingswijziging voordat de huidige is begrepen.

## Terugdraaiplan

Als de Gateway mogelijk te veel is blootgesteld:

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

Daarna:

1. Stop openbare forwarding, Tailscale Funnel of reverse-proxyroutes.
2. Roteer Gateway-tokens/-wachtwoorden en getroffen integratiereferenties.
3. Verwijder `"*"` en onverwachte afzenders uit allowlists.
4. Controleer recente auditlogs, uitvoeringsgeschiedenis, toolaanroepen en configuratiewijzigingen.
5. Voer `openclaw security audit --deep` opnieuw uit.
6. Schakel toegang opnieuw in met het smalste patroon dat aan de workflow voldoet.

## Reviewchecklist

- Gateway blijft alleen-loopback tenzij er een gedocumenteerde reden is.
- Niet-loopbacktoegang heeft authenticatie, firewalling en geen directe openbare route.
- Trusted-proxy-implementaties hebben strikte proxy-IP's en headercontroles.
- DM's gebruiken koppeling of allowlists, niet standaard open toegang.
- Groepen vereisen vermeldingen of expliciete allowlists.
- Gedeelde kanalen bereiken geen persoonlijke referenties.
- Niet-main-sessies draaien in sandboxmodus.
- Host-exec en verhoogde tools worden geweigerd of vereisen goedkeuring.
- Logs redigeren geheimen.
- Kritieke auditbevindingen zijn opgelost.
- Terugdraaistappen zijn getest en gedocumenteerd.
