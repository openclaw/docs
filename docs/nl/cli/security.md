---
read_when:
    - Je wilt een snelle beveiligingsaudit uitvoeren op de configuratie/status
    - Je wilt veilige ‘fix’-suggesties toepassen (machtigingen, standaardinstellingen aanscherpen)
summary: CLI-referentie voor `openclaw security` (veelvoorkomende beveiligingsvalkuilen controleren en oplossen)
title: Beveiliging
x-i18n:
    generated_at: "2026-07-16T15:26:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 613d1afa63e46a7dc3474d0b175cf2389703a86b00f861b4140d64e11c28ece5
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Beveiligingstools: audit plus optionele veilige oplossingen. Gerelateerd: [Beveiliging](/nl/gateway/security).

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --auth password --password <password>
openclaw security audit --fix
openclaw security audit --json
```

## Auditmodi

Een gewone `security audit` blijft op het koude pad voor configuratie/bestandssysteem/alleen-lezen: deze ontdekt geen beveiligingscollectors van de Plugin-runtime, zodat routinematige audits niet elke geïnstalleerde Plugin-runtime laden. `--deep` voegt best-effort live Gateway-controles en beveiligingsauditcollectors van Plugins toe (expliciete interne aanroepers kunnen zich ook aanmelden voor die collectors wanneer ze al een geschikt runtimebereik hebben).

Als Gateway-wachtwoordauthenticatie alleen bij het opstarten wordt opgegeven, geef je dezelfde waarde door met `--auth password --password <password>`, zodat de audit deze kan controleren aan de hand van `hooks.token`.

## Wat wordt gecontroleerd

**DM-/vertrouwensmodel**

- Waarschuwt wanneer meerdere DM-afzenders de hoofdsessie delen en beveelt een veilige DM-modus aan: `session.dmScope="per-channel-peer"` (of `per-account-channel-peer` voor kanalen met meerdere accounts) voor gedeelde inboxen. Dit is beveiliging voor samenwerking/gedeelde inboxen, geen isolatie voor operators die elkaar niet vertrouwen; splits vertrouwensgrenzen met afzonderlijke gateways (of afzonderlijke OS-gebruikers/hosts).
- Geeft `security.trust_model.multi_user_heuristic` wanneer de configuratie wijst op waarschijnlijke toegang door gedeelde gebruikers (bijvoorbeeld open DM-/groepsbeleid, geconfigureerde groepsdoelen of jokerregels voor afzenders) — het standaardvertrouwensmodel van OpenClaw is een persoonlijke assistent (één operator), geen vijandige multitenant-isolatie. Voor opzettelijke configuraties met gedeelde gebruikers: voer alle sessies in een sandbox uit, beperk bestandssysteemtoegang tot de werkruimte en houd persoonlijke/privé-identiteiten of aanmeldgegevens buiten die runtime.
- Waarschuwt wanneer kleine modellen (`<=300B` parameters) zonder sandboxing en met ingeschakelde web-/browsertools worden gebruikt.

**Webhook/hooks**

Bij het opstarten wordt een niet-fatale beveiligingswaarschuwing gelogd en de audit markeert hergebruik van `hooks.token` voor actieve gedeelde geheime Gateway-authenticatiewaarden (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`). Waarschuwt ook wanneer:

- `hooks.token` kort is
- `hooks.path="/"`
- `hooks.defaultSessionKey` niet is ingesteld
- `hooks.allowedAgentIds` onbeperkt is
- overschrijvingen van `sessionKey` voor aanvragen zijn ingeschakeld
- overschrijvingen zijn ingeschakeld zonder `hooks.allowedSessionKeyPrefixes`

Voer `openclaw doctor --fix` uit om een permanent opgeslagen, hergebruikte `hooks.token` te roteren en werk vervolgens externe hook-afzenders bij zodat ze het nieuwe token gebruiken.

**Sandbox/tools**

- Waarschuwt wanneer Docker-instellingen voor de sandbox zijn geconfigureerd terwijl de sandboxmodus uitgeschakeld is.
- Waarschuwt wanneer `gateway.nodes.denyCommands` ineffectieve patroonachtige/onbekende vermeldingen gebruikt (overeenkomst gebeurt alleen exact op de naam van Node-opdrachten, niet door shelltekst te filteren).
- Waarschuwt wanneer `gateway.nodes.allowCommands` gevaarlijke Node-opdrachten expliciet inschakelt.
- Waarschuwt wanneer de algemene `tools.profile="minimal"` wordt overschreven door agenttoolprofielen.
- Waarschuwt wanneer schrijf-/bewerkingstools zijn uitgeschakeld, maar `exec` nog steeds beschikbaar is zonder een beperkende sandboxgrens voor het bestandssysteem.
- Waarschuwt wanneer open DM's of groepen runtime-/bestandssysteemtools beschikbaar stellen zonder sandbox-/werkruimtebeveiliging.
- Waarschuwt wanneer tools van geïnstalleerde Plugins bereikbaar kunnen zijn onder een ruimhartig toolbeleid.

**Sandboxbrowser**

- Waarschuwt wanneer de sandboxbrowser het Docker-netwerk `bridge` gebruikt zonder `sandbox.browser.cdpSourceRange`.
- Markeert gevaarlijke Docker-netwerkmodi voor de sandbox, waaronder `host` en deelname aan `container:*`-naamruimten.
- Waarschuwt wanneer bestaande Docker-containers voor de sandboxbrowser ontbrekende/verouderde hashlabels hebben (bijvoorbeeld containers van vóór de migratie zonder `openclaw.browserConfigEpoch`) en beveelt `openclaw sandbox recreate --browser --all` aan.

**Netwerk/detectie**

- Markeert `gateway.allowRealIpFallback=true` (risico op vervalsing van headers wanneer proxy's verkeerd zijn geconfigureerd).
- Markeert `discovery.mdns.mode="full"` (lekken van metadata via mDNS TXT-records).
- Waarschuwt wanneer `gateway.auth.mode="none"` Gateway-HTTP-API's bereikbaar laat zonder een gedeeld geheim (`/tools/invoke` plus elk ingeschakeld `/v1/*`-eindpunt).

**Plugins/kanalen**

- Waarschuwt wanneer op npm gebaseerde installatiegegevens voor Plugins/hooks niet aan een vaste versie zijn gekoppeld, integriteitsmetadata missen of afwijken van de momenteel geïnstalleerde pakketversies.
- Waarschuwt wanneer kanaaltoelatingslijsten afhankelijk zijn van veranderlijke namen/e-mailadressen/tags in plaats van stabiele ID's (Discord, Slack, Google Chat, Microsoft Teams, Mattermost en IRC-bereiken waar van toepassing).

Instellingen met het voorvoegsel `dangerous`/`dangerously` zijn expliciete noodoverschrijvingen voor operators; het inschakelen ervan vormt op zichzelf geen melding van een beveiligingslek. Zie voor de volledige inventaris van gevaarlijke parameters „Samenvatting van onveilige of gevaarlijke vlaggen” in [Beveiliging](/nl/gateway/security).

## Gedrag van SecretRef

`security audit` zet ondersteunde SecretRefs voor de betreffende paden om in de alleen-lezenmodus. Als een SecretRef niet beschikbaar is in het huidige opdrachtpad, gaat de audit door en rapporteert deze `secretDiagnostics` in plaats van vast te lopen. `--token` en `--password` overschrijven alleen de authenticatie voor grondige controles voor die opdrachtaanroep; ze herschrijven geen configuratie of SecretRef-toewijzingen.

## Onderdrukkingen

Accepteer bewust blijvende bevindingen met `security.audit.suppressions`. Elke onderdrukking komt overeen met een exacte `checkId` en kan worden beperkt met hoofdletterongevoelige `titleIncludes`- en/of `detailIncludes`-subtekenreeksen:

```json
{
  "security": {
    "audit": {
      "suppressions": [
        {
          "checkId": "plugins.tools_reachable_permissive_policy",
          "detailIncludes": "Enabled extension plugins: gbrain",
          "reason": "trusted local operator plugin"
        }
      ]
    }
  }
}
```

Onderdrukte bevindingen worden verwijderd uit de actieve lijsten `summary` en `findings`. JSON-uitvoer bewaart ze onder `suppressedFindings` ten behoeve van controleerbaarheid. Wanneer onderdrukkingen zijn geconfigureerd, bevat de actieve uitvoer ook een niet-onderdrukbare informatiebevinding `security.audit.suppressions.active`, zodat lezers kunnen zien dat de audit is gefilterd. Gevaarlijke configuratievlaggen worden als één vlag per bevinding uitgevoerd, zodat het accepteren van één gevaarlijke vlag geen andere ingeschakelde vlaggen verbergt die dezelfde `config.insecure_or_dangerous_flags`-checkId delen.

Omdat onderdrukkingen blijvende risico's kunnen verbergen, is voor het toevoegen of verwijderen ervan via shellopdrachten die door een agent worden uitgevoerd exec-goedkeuring vereist, tenzij exec al wordt uitgevoerd met `security="full"` en `ask="off"` voor vertrouwde lokale automatisering.

## JSON-uitvoer

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Met `--fix --json` bevat de uitvoer zowel de herstelacties als het eindrapport:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Wat `--fix` wijzigt

Past veilige, deterministische herstelmaatregelen toe:

- zet veelvoorkomende `groupPolicy="open"` om naar `groupPolicy="allowlist"` (inclusief accountvarianten in ondersteunde kanalen)
- wanneer WhatsApp-groepsbeleid wordt omgezet naar `allowlist`, wordt `groupAllowFrom` gevuld vanuit het opgeslagen bestand `allowFrom` wanneer die lijst bestaat en de configuratie nog geen `allowFrom` definieert
- stelt `logging.redactSensitive` in van `"off"` op `"tools"`
- verscherpt machtigingen voor status/configuratie en veelvoorkomende gevoelige bestanden (`credentials/*.json`, `auth-profiles.json`, `openclaw-agent.sqlite` en verouderde sessieartefacten)
- verscherpt ook de machtigingen voor configuratie-invoegbestanden waarnaar vanuit `openclaw.json` wordt verwezen
- gebruikt `chmod` op POSIX-hosts en `icacls`-resets op Windows

`--fix` doet **niet** het volgende:

- tokens/wachtwoorden/API-sleutels roteren
- tools uitschakelen (`gateway`, `cron`, `exec`, enzovoort)
- keuzes voor Gateway-binding/authenticatie/netwerkblootstelling wijzigen
- Plugins/Skills verwijderen of herschrijven

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Beveiligingsaudit](/nl/gateway/security)
