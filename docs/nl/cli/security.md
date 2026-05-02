---
read_when:
    - Je wilt een snelle beveiligingsaudit uitvoeren op configuratie-/statusgegevens
    - U wilt veilige “fix”-suggesties toepassen (machtigingen, standaardinstellingen aanscherpen)
summary: CLI-referentie voor `openclaw security` (veelvoorkomende beveiligingsvalkuilen controleren en oplossen)
title: Beveiliging
x-i18n:
    generated_at: "2026-05-02T11:12:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44eb50368cb54441782a7c4e20fab24d0488b80c9a1eedf8e1eb31dc8d7a9cf6
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Beveiligingstools (audit + optionele fixes).

Gerelateerd:

- Beveiligingsgids: [Beveiliging](/nl/gateway/security)

## Audit

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

Gewoon `security audit` blijft op het koude config-/bestandssysteem-/alleen-lezen-pad. Het ontdekt standaard geen beveiligingscollectors van Plugin-runtimes, zodat routine-audits niet elke geinstalleerde Plugin-runtime laden. Gebruik `--deep` om best-effort live Gateway-probes en beveiligingsauditcollectors die eigendom zijn van Plugins mee te nemen; expliciete interne aanroepers kunnen ook voor die Plugin-eigen collectors kiezen wanneer ze al een passend runtimebereik hebben.

De audit waarschuwt wanneer meerdere DM-afzenders de hoofdsessie delen en beveelt **veilige DM-modus** aan: `session.dmScope="per-channel-peer"` (of `per-account-channel-peer` voor kanalen met meerdere accounts) voor gedeelde inboxen.
Dit is bedoeld voor hardening van cooperatieve/gedeelde inboxen. Een enkele Gateway die wordt gedeeld door wederzijds niet-vertrouwde/vijandige beheerders is geen aanbevolen inrichting; splits vertrouwensgrenzen met aparte gateways (of aparte OS-gebruikers/hosts).
De audit geeft ook `security.trust_model.multi_user_heuristic` weer wanneer config wijst op waarschijnlijke ingress door gedeelde gebruikers (bijvoorbeeld open DM-/groepsbeleid, geconfigureerde groepsdoelen of wildcardregels voor afzenders), en herinnert je eraan dat OpenClaw standaard een vertrouwensmodel voor persoonlijke assistenten gebruikt.
Voor opzettelijke opstellingen met gedeelde gebruikers adviseert de audit om alle sessies te sandboxen, bestandssysteemtoegang tot de workspace te beperken en persoonlijke/prive-identiteiten of credentials buiten die runtime te houden.
De audit waarschuwt ook wanneer kleine modellen (`<=300B`) zonder sandboxing worden gebruikt en web-/browsertools zijn ingeschakeld.
Voor Webhook-ingress waarschuwt de audit wanneer `hooks.token` het Gateway-token hergebruikt, wanneer `hooks.token` kort is, wanneer `hooks.path="/"`, wanneer `hooks.defaultSessionKey` niet is ingesteld, wanneer `hooks.allowedAgentIds` onbeperkt is, wanneer request-overschrijvingen van `sessionKey` zijn ingeschakeld en wanneer overschrijvingen zijn ingeschakeld zonder `hooks.allowedSessionKeyPrefixes`.
De audit waarschuwt ook wanneer sandbox-Docker-instellingen zijn geconfigureerd terwijl sandboxmodus uit staat, wanneer `gateway.nodes.denyCommands` ineffectieve patroonachtige/onbekende vermeldingen gebruikt (alleen exacte matching op node-commandonamen, geen filtering van shell-tekst), wanneer `gateway.nodes.allowCommands` gevaarlijke node-commando's expliciet inschakelt, wanneer globale `tools.profile="minimal"` wordt overschreven door agenttoolprofielen, wanneer open groepen runtime-/bestandssysteemtools zonder sandbox-/workspace-bewaking blootstellen en wanneer geinstalleerde Plugin-tools bereikbaar kunnen zijn onder ruimhartig toolbeleid.
De audit markeert ook `gateway.allowRealIpFallback=true` (risico op header-spoofing als proxies verkeerd zijn geconfigureerd) en `discovery.mdns.mode="full"` (metadatalek via mDNS TXT-records).
De audit waarschuwt ook wanneer sandboxbrowser Docker `bridge`-netwerk gebruikt zonder `sandbox.browser.cdpSourceRange`.
De audit markeert ook gevaarlijke Docker-netwerkmodi voor sandboxen (waaronder `host` en `container:*` namespace-joins).
De audit waarschuwt ook wanneer bestaande Docker-containers voor sandboxbrowsers ontbrekende/verouderde hashlabels hebben (bijvoorbeeld containers van voor de migratie zonder `openclaw.browserConfigEpoch`) en beveelt `openclaw sandbox recreate --browser --all` aan.
De audit waarschuwt ook wanneer npm-gebaseerde installatiegegevens voor Plugins/hooks niet gepind zijn, integriteitsmetadata missen of afwijken van momenteel geinstalleerde pakketversies.
De audit waarschuwt wanneer allowlists voor kanalen vertrouwen op veranderlijke namen/e-mails/tags in plaats van stabiele ID's (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC-scopes waar van toepassing).
De audit waarschuwt wanneer `gateway.auth.mode="none"` Gateway HTTP-API's bereikbaar laat zonder gedeeld geheim (`/tools/invoke` plus elk ingeschakeld `/v1/*`-endpoint).
Instellingen met prefix `dangerous`/`dangerously` zijn expliciete break-glass-overschrijvingen door de beheerder; het inschakelen daarvan is op zichzelf geen beveiligingskwetsbaarheidsrapport.
Zie voor de volledige inventaris van gevaarlijke parameters de sectie "Samenvatting van onveilige of gevaarlijke vlaggen" in [Beveiliging](/nl/gateway/security).

SecretRef-gedrag:

- `security audit` lost ondersteunde SecretRefs in alleen-lezen-modus op voor de gerichte paden.
- Als een SecretRef niet beschikbaar is in het huidige commandopad, gaat de audit door en rapporteert `secretDiagnostics` (in plaats van te crashen).
- `--token` en `--password` overschrijven alleen deep-probe-authenticatie voor die commandoaanroep; ze herschrijven geen config of SecretRef-mappings.

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

`--fix` past veilige, deterministische herstelacties toe:

- zet veelvoorkomende `groupPolicy="open"` om naar `groupPolicy="allowlist"` (inclusief accountvarianten in ondersteunde kanalen)
- wanneer WhatsApp-groepsbeleid naar `allowlist` wordt omgezet, wordt `groupAllowFrom` gevuld vanuit
  het opgeslagen `allowFrom`-bestand wanneer die lijst bestaat en config nog niet
  `allowFrom` definieert
- zet `logging.redactSensitive` van `"off"` naar `"tools"`
- scherpt permissies aan voor state/config en veelvoorkomende gevoelige bestanden
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sessie-
  `*.jsonl`)
- scherpt ook config-include-bestanden aan waarnaar vanuit `openclaw.json` wordt verwezen
- gebruikt `chmod` op POSIX-hosts en `icacls`-resets op Windows

`--fix` doet **niet** het volgende:

- tokens/wachtwoorden/API-sleutels roteren
- tools uitschakelen (`gateway`, `cron`, `exec`, enz.)
- keuzes voor gateway-bind/auth/netwerkblootstelling wijzigen
- Plugins/Skills verwijderen of herschrijven

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Beveiligingsaudit](/nl/gateway/security)
