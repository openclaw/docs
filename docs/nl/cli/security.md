---
read_when:
    - Je wilt een snelle beveiligingsaudit uitvoeren op configuratie/status
    - Je wilt veilige “fix”-suggesties toepassen (machtigingen, standaardwaarden aanscherpen)
summary: CLI-referentie voor `openclaw security` (veelvoorkomende beveiligingsvalkuilen controleren en oplossen)
title: Beveiliging
x-i18n:
    generated_at: "2026-04-29T22:34:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4c15f2111cac2492aa331e5217dd18de169c8b6440f103e3009e059a06d81f6
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Beveiligingstools (audit + optionele oplossingen).

Gerelateerd:

- Beveiligingshandleiding: [Beveiliging](/nl/gateway/security)

## Audit

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

De audit waarschuwt wanneer meerdere DM-afzenders de hoofdsessie delen en beveelt **beveiligde DM-modus** aan: `session.dmScope="per-channel-peer"` (of `per-account-channel-peer` voor kanalen met meerdere accounts) voor gedeelde inboxen.
Dit is bedoeld voor hardening van samenwerkende/gedeelde inboxen. Een enkele Gateway die wordt gedeeld door operators die elkaar onderling niet vertrouwen of vijandig zijn, is geen aanbevolen configuratie; splits vertrouwensgrenzen met afzonderlijke gateways (of afzonderlijke OS-gebruikers/hosts).
Deze geeft ook `security.trust_model.multi_user_heuristic` uit wanneer de configuratie waarschijnlijk gedeelde-gebruiker-ingress suggereert (bijvoorbeeld open DM-/groepsbeleid, geconfigureerde groepsdoelen of wildcard-afzenderregels), en herinnert je eraan dat OpenClaw standaard een vertrouwensmodel voor persoonlijke assistenten gebruikt.
Voor bewust gedeelde-gebruiker-configuraties is de auditrichtlijn om alle sessies te sandboxen, bestandssysteemtoegang tot de werkruimte te beperken en persoonlijke/privé-identiteiten of referenties buiten die runtime te houden.
De audit waarschuwt ook wanneer kleine modellen (`<=300B`) zonder sandboxing en met ingeschakelde web-/browsertools worden gebruikt.
Voor Webhook-ingress waarschuwt deze wanneer `hooks.token` de Gateway-token hergebruikt, wanneer `hooks.token` kort is, wanneer `hooks.path="/"`, wanneer `hooks.defaultSessionKey` niet is ingesteld, wanneer `hooks.allowedAgentIds` onbeperkt is, wanneer aanvraag-`sessionKey`-overrides zijn ingeschakeld, en wanneer overrides zijn ingeschakeld zonder `hooks.allowedSessionKeyPrefixes`.
De audit waarschuwt ook wanneer sandbox Docker-instellingen zijn geconfigureerd terwijl sandboxmodus uit staat, wanneer `gateway.nodes.denyCommands` ineffectieve patroonachtige/onbekende vermeldingen gebruikt (alleen exacte matching van Node-opdrachtnamen, geen filtering van shelltekst), wanneer `gateway.nodes.allowCommands` expliciet gevaarlijke Node-opdrachten inschakelt, wanneer globale `tools.profile="minimal"` wordt overschreven door agent-toolprofielen, wanneer open groepen runtime-/bestandssysteemtools blootstellen zonder sandbox-/werkruimtebewaking, en wanneer geïnstalleerde Plugin-tools bereikbaar kunnen zijn onder een permissief toolbeleid.
De audit markeert ook `gateway.allowRealIpFallback=true` (risico op header-spoofing als proxy's verkeerd zijn geconfigureerd) en `discovery.mdns.mode="full"` (metadatalek via mDNS TXT-records).
De audit waarschuwt ook wanneer de sandboxbrowser het Docker-`bridge`-netwerk gebruikt zonder `sandbox.browser.cdpSourceRange`.
De audit markeert ook gevaarlijke sandbox Docker-netwerkmodi (waaronder `host` en `container:*`-namespace-joins).
De audit waarschuwt ook wanneer bestaande sandboxbrowser-Docker-containers ontbrekende/verouderde hashlabels hebben (bijvoorbeeld containers van voor de migratie zonder `openclaw.browserConfigEpoch`) en beveelt `openclaw sandbox recreate --browser --all` aan.
De audit waarschuwt ook wanneer op npm gebaseerde Plugin-/hook-installatierecords niet vastgepind zijn, integriteitsmetadata missen of afwijken van de momenteel geïnstalleerde pakketversies.
De audit waarschuwt wanneer kanaal-allowlists vertrouwen op veranderlijke namen/e-mails/tags in plaats van stabiele ID's (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC-scopes waar van toepassing).
De audit waarschuwt wanneer `gateway.auth.mode="none"` Gateway HTTP-API's bereikbaar laat zonder gedeeld geheim (`/tools/invoke` plus elk ingeschakeld `/v1/*`-eindpunt).
Instellingen met prefix `dangerous`/`dangerously` zijn expliciete noodoverrides voor operators; het inschakelen ervan is op zichzelf geen melding van een beveiligingskwetsbaarheid.
Zie voor de volledige inventaris van gevaarlijke parameters de sectie "Samenvatting van onveilige of gevaarlijke vlaggen" in [Beveiliging](/nl/gateway/security).

SecretRef-gedrag:

- `security audit` lost ondersteunde SecretRefs in alleen-lezenmodus op voor de doelpaden.
- Als een SecretRef niet beschikbaar is in het huidige opdrachtpad, gaat de audit door en rapporteert deze `secretDiagnostics` (in plaats van te crashen).
- `--token` en `--password` overschrijven alleen deep-probe-authenticatie voor die opdrachtaanroep; ze herschrijven geen configuratie of SecretRef-toewijzingen.

## JSON-uitvoer

Gebruik `--json` voor CI-/beleidscontroles:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Als `--fix` en `--json` worden gecombineerd, bevat de uitvoer zowel oplossingsacties als het eindrapport:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Wat `--fix` wijzigt

`--fix` past veilige, deterministische oplossingen toe:

- zet gangbaar `groupPolicy="open"` om naar `groupPolicy="allowlist"` (inclusief accountvarianten in ondersteunde kanalen)
- wanneer WhatsApp-groepsbeleid wordt omgezet naar `allowlist`, vult het `groupAllowFrom` vooraf vanuit
  het opgeslagen `allowFrom`-bestand wanneer die lijst bestaat en de configuratie nog geen
  `allowFrom` definieert
- stelt `logging.redactSensitive` in van `"off"` naar `"tools"`
- scherpt machtigingen aan voor status/configuratie en veelvoorkomende gevoelige bestanden
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sessie-
  `*.jsonl`)
- scherpt ook configuratie-include-bestanden aan waarnaar vanuit `openclaw.json` wordt verwezen
- gebruikt `chmod` op POSIX-hosts en `icacls`-resets op Windows

`--fix` doet **niet** het volgende:

- tokens/wachtwoorden/API-sleutels roteren
- tools uitschakelen (`gateway`, `cron`, `exec`, enz.)
- keuzes voor Gateway-bind/authenticatie/netwerkblootstelling wijzigen
- Plugins/Skills verwijderen of herschrijven

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Beveiligingsaudit](/nl/gateway/security)
