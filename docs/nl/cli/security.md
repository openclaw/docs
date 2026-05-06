---
read_when:
    - Je wilt een snelle beveiligingsaudit uitvoeren op config/state
    - Je wilt veilige suggesties voor "oplossingen" toepassen (machtigingen, standaardinstellingen aanscherpen)
summary: CLI-referentie voor `openclaw security` (veelvoorkomende beveiligingsvalkuilen controleren en oplossen)
title: Beveiliging
x-i18n:
    generated_at: "2026-05-06T17:54:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e70c9ea085bc9c0edebe801e4feb876d1cb776848d693e9699f4d238fc9b60f
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

Gewone `security audit` blijft op het koude config-/bestandssysteem-/alleen-lezen-pad. Deze ontdekt standaard geen beveiligingscollectors van Plugin-runtimes, zodat routinematige audits niet elke geinstalleerde Plugin-runtime laden. Gebruik `--deep` om best-effort live Gateway-probes en beveiligingsauditcollectors van Plugins mee te nemen; expliciete interne aanroepers kunnen ook kiezen voor die Plugin-owned collectors wanneer ze al een passend runtimebereik hebben.

De audit waarschuwt wanneer meerdere DM-afzenders de hoofdsessie delen en beveelt **secure DM mode** aan: `session.dmScope="per-channel-peer"` (of `per-account-channel-peer` voor kanalen met meerdere accounts) voor gedeelde inboxen.
Dit is bedoeld voor verharding van cooperatieve/gedeelde inboxen. Een enkele Gateway die wordt gedeeld door operators die elkaar niet vertrouwen of vijandig tegenover elkaar staan, is geen aanbevolen opstelling; splits vertrouwensgrenzen met aparte gateways (of aparte OS-gebruikers/hosts).
Deze geeft ook `security.trust_model.multi_user_heuristic` uit wanneer configuratie wijst op waarschijnlijke gedeelde-gebruikersingang (bijvoorbeeld open DM-/groepsbeleid, geconfigureerde groepsdoelen of wildcard-afzenderregels), en herinnert je eraan dat OpenClaw standaard een personal-assistant-vertrouwensmodel is.
Voor opzettelijke gedeelde-gebruikersopstellingen is het auditadvies om alle sessies te sandboxen, bestandssysteemtoegang tot de werkruimte te beperken en persoonlijke/prive-identiteiten of referenties buiten die runtime te houden.
Deze waarschuwt ook wanneer kleine modellen (`<=300B`) worden gebruikt zonder sandboxing en met web-/browsertools ingeschakeld.
Voor Webhook-ingang waarschuwt deze wanneer `hooks.token` het Gateway-token hergebruikt, wanneer `hooks.token` kort is, wanneer `hooks.path="/"`, wanneer `hooks.defaultSessionKey` niet is ingesteld, wanneer `hooks.allowedAgentIds` onbeperkt is, wanneer overschrijvingen van request-`sessionKey` zijn ingeschakeld en wanneer overschrijvingen zijn ingeschakeld zonder `hooks.allowedSessionKeyPrefixes`.
Deze waarschuwt ook wanneer sandbox-Docker-instellingen zijn geconfigureerd terwijl sandboxmodus uit staat, wanneer `gateway.nodes.denyCommands` ineffectieve patroonachtige/onbekende items gebruikt (alleen exacte matching op Node-commandonamen, geen shell-tekstfiltering), wanneer `gateway.nodes.allowCommands` expliciet gevaarlijke Node-commando's inschakelt, wanneer globale `tools.profile="minimal"` wordt overschreven door agenttoolprofielen, wanneer open groepen runtime-/bestandssysteemtools blootstellen zonder sandbox-/werkruimtebescherming, en wanneer geinstalleerde Plugin-tools bereikbaar kunnen zijn onder ruim toolbeleid.
Deze markeert ook `gateway.allowRealIpFallback=true` (risico op header-spoofing als proxy's verkeerd zijn geconfigureerd) en `discovery.mdns.mode="full"` (metadatalek via mDNS TXT-records).
Deze waarschuwt ook wanneer de sandboxbrowser het Docker-`bridge`-netwerk gebruikt zonder `sandbox.browser.cdpSourceRange`.
Deze markeert ook gevaarlijke sandbox-Docker-netwerkmodi (waaronder `host` en `container:*`-namespace-joins).
Deze waarschuwt ook wanneer bestaande sandboxbrowser-Docker-containers ontbrekende/verouderde hashlabels hebben (bijvoorbeeld containers van voor de migratie zonder `openclaw.browserConfigEpoch`) en beveelt `openclaw sandbox recreate --browser --all` aan.
Deze waarschuwt ook wanneer npm-gebaseerde Plugin-/hook-installatierecords niet gepind zijn, integriteitsmetadata missen of afwijken van momenteel geinstalleerde pakketversies.
Deze waarschuwt wanneer kanaal-allowlists vertrouwen op veranderlijke namen/e-mails/tags in plaats van stabiele ID's (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC-scopes waar van toepassing).
Deze waarschuwt wanneer `gateway.auth.mode="none"` Gateway-HTTP-API's bereikbaar laat zonder gedeeld geheim (`/tools/invoke` plus elk ingeschakeld `/v1/*`-endpoint).
Instellingen met het voorvoegsel `dangerous`/`dangerously` zijn expliciete break-glass-operatoroverschrijvingen; het inschakelen ervan is op zichzelf geen melding van een beveiligingskwetsbaarheid.
Zie voor de volledige inventaris van gevaarlijke parameters de sectie "Samenvatting van onveilige of gevaarlijke flags" in [Beveiliging](/nl/gateway/security).

SecretRef-gedrag:

- `security audit` lost ondersteunde SecretRefs in alleen-lezen-modus op voor de gerichte paden.
- Als een SecretRef niet beschikbaar is in het huidige commandopad, gaat de audit door en rapporteert deze `secretDiagnostics` (in plaats van te crashen).
- `--token` en `--password` overschrijven alleen deep-probe-authenticatie voor die opdrachtuitvoering; ze herschrijven geen configuratie of SecretRef-mappings.

## JSON-uitvoer

Gebruik `--json` voor CI-/beleidscontroles:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Als `--fix` en `--json` worden gecombineerd, bevat de uitvoer zowel fixacties als het eindrapport:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Wat `--fix` wijzigt

`--fix` past veilige, deterministische remediaties toe:

- zet gewone `groupPolicy="open"` om naar `groupPolicy="allowlist"` (inclusief accountvarianten in ondersteunde kanalen)
- wanneer WhatsApp-groepsbeleid naar `allowlist` wordt omgezet, vult dit `groupAllowFrom` vooraf vanuit
  het opgeslagen `allowFrom`-bestand wanneer die lijst bestaat en configuratie nog niet
  `allowFrom` definieert
- zet `logging.redactSensitive` van `"off"` naar `"tools"`
- scherpt machtigingen aan voor status/configuratie en veelvoorkomende gevoelige bestanden
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sessie-
  `*.jsonl`)
- scherpt ook configuratie-include-bestanden aan waarnaar vanuit `openclaw.json` wordt verwezen
- gebruikt `chmod` op POSIX-hosts en `icacls`-resets op Windows

`--fix` doet **niet** het volgende:

- tokens/wachtwoorden/API-sleutels roteren
- tools (`gateway`, `cron`, `exec`, enz.) uitschakelen
- Gateway-bind-/auth-/netwerkblootstellingskeuzes wijzigen
- Plugins/Skills verwijderen of herschrijven

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Beveiligingsaudit](/nl/gateway/security)
