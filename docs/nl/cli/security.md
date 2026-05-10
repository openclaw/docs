---
read_when:
    - Je wilt een snelle beveiligingsaudit uitvoeren op configuratie/status
    - Je wilt veilige oplossingssuggesties toepassen (machtigingen, standaardinstellingen aanscherpen)
summary: CLI-referentie voor `openclaw security` (veelvoorkomende beveiligingsvalkuilen controleren en oplossen)
title: Beveiliging
x-i18n:
    generated_at: "2026-05-10T19:29:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb7c65b2d5b17ade8756997f53f28283fbbc9146ccc460fb0e2d49b6d64777e5
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Beveiligingstools (audit + optionele oplossingen).

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

Gewone `security audit` blijft op het koude configuratie-/bestandssysteem-/alleen-lezen-pad. Het ontdekt standaard geen beveiligingscollectors voor Plugin-runtime, zodat routine-audits niet elke geïnstalleerde Plugin-runtime laden. Gebruik `--deep` om best-effort live Gateway-probes en beveiligingsauditcollectors van Plugins mee te nemen; expliciete interne callers kunnen zich ook aanmelden voor die Plugin-eigen collectors wanneer ze al een passend runtimebereik hebben.

De audit waarschuwt wanneer meerdere DM-afzenders de hoofdsessie delen en beveelt **veilige DM-modus** aan: `session.dmScope="per-channel-peer"` (of `per-account-channel-peer` voor multi-accountkanalen) voor gedeelde inboxen.
Dit is bedoeld voor hardening van coöperatieve/gedeelde inboxen. Eén Gateway die wordt gedeeld door operators die elkaar niet vertrouwen of vijandig zijn, is geen aanbevolen setup; splits vertrouwensgrenzen met afzonderlijke Gateways (of afzonderlijke OS-gebruikers/hosts).
Ook wordt `security.trust_model.multi_user_heuristic` uitgegeven wanneer configuratie waarschijnlijk gedeelde-gebruikersingress suggereert (bijvoorbeeld open DM-/groepsbeleid, geconfigureerde groepsdoelen of wildcard-afzenderregels), en wordt eraan herinnerd dat OpenClaw standaard een vertrouwensmodel voor persoonlijke assistenten is.
Voor opzettelijke gedeelde-gebruikersetups is de auditaanbeveling om alle sessies te sandboxen, bestandssysteemtoegang tot de workspace te beperken en persoonlijke/privé-identiteiten of referenties buiten die runtime te houden.
Ook wordt gewaarschuwd wanneer kleine modellen (`<=300B`) zonder sandboxing en met ingeschakelde web-/browsertools worden gebruikt.
Voor Webhook-ingress waarschuwt het wanneer `hooks.token` het Gateway-token hergebruikt, wanneer `hooks.token` kort is, wanneer `hooks.path="/"`, wanneer `hooks.defaultSessionKey` niet is ingesteld, wanneer `hooks.allowedAgentIds` onbeperkt is, wanneer `sessionKey`-overschrijvingen in requests zijn ingeschakeld, en wanneer overschrijvingen zijn ingeschakeld zonder `hooks.allowedSessionKeyPrefixes`.
Ook wordt gewaarschuwd wanneer Docker-instellingen voor de sandbox zijn geconfigureerd terwijl sandboxmodus uit staat, wanneer `gateway.nodes.denyCommands` ineffectieve patroonachtige/onbekende vermeldingen gebruikt (alleen exacte matching op node-opdrachtnaam, geen filtering van shelltekst), wanneer `gateway.nodes.allowCommands` gevaarlijke node-opdrachten expliciet inschakelt, wanneer globale `tools.profile="minimal"` wordt overschreven door toolprofielen van agents, wanneer schrijf-/bewerkingstools zijn uitgeschakeld maar `exec` nog steeds beschikbaar is zonder beperkende sandbox-bestandssysteemgrens, wanneer open groepen runtime-/bestandssysteemtools blootstellen zonder sandbox-/workspace-afscherming, en wanneer geïnstalleerde Plugin-tools bereikbaar kunnen zijn onder ruimhartig toolbeleid.
Ook worden `gateway.allowRealIpFallback=true` (risico op header-spoofing als proxies verkeerd zijn geconfigureerd) en `discovery.mdns.mode="full"` (metadatalek via mDNS TXT-records) gemarkeerd.
Ook wordt gewaarschuwd wanneer de sandboxbrowser Docker-netwerk `bridge` gebruikt zonder `sandbox.browser.cdpSourceRange`.
Ook worden gevaarlijke Docker-netwerkmodi voor de sandbox gemarkeerd (waaronder `host` en namespace-joins met `container:*`).
Ook wordt gewaarschuwd wanneer bestaande Docker-containers voor de sandboxbrowser ontbrekende/verouderde hashlabels hebben (bijvoorbeeld containers van vóór de migratie zonder `openclaw.browserConfigEpoch`) en wordt `openclaw sandbox recreate --browser --all` aanbevolen.
Ook wordt gewaarschuwd wanneer op npm gebaseerde installatiegegevens voor Plugins/hooks niet gepind zijn, integriteitsmetadata missen of afwijken van momenteel geïnstalleerde pakketversies.
Er wordt gewaarschuwd wanneer kanaal-allowlists vertrouwen op veranderlijke namen/e-mails/tags in plaats van stabiele ID's (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC-bereiken waar van toepassing).
Er wordt gewaarschuwd wanneer `gateway.auth.mode="none"` Gateway HTTP-API's bereikbaar laat zonder gedeeld geheim (`/tools/invoke` plus elk ingeschakeld `/v1/*`-endpoint).
Instellingen met het prefix `dangerous`/`dangerously` zijn expliciete break-glass-operatoroverschrijvingen; het inschakelen ervan is op zichzelf geen beveiligingskwetsbaarheidsrapport.
Zie voor de volledige inventaris van gevaarlijke parameters de sectie "Samenvatting van onveilige of gevaarlijke flags" in [Beveiliging](/nl/gateway/security).

SecretRef-gedrag:

- `security audit` lost ondersteunde SecretRefs op in alleen-lezen-modus voor de doelpaden.
- Als een SecretRef niet beschikbaar is in het huidige opdrachtpad, gaat de audit door en rapporteert `secretDiagnostics` (in plaats van te crashen).
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

- zet veelvoorkomende `groupPolicy="open"` om naar `groupPolicy="allowlist"` (inclusief accountvarianten in ondersteunde kanalen)
- wanneer het WhatsApp-groepsbeleid wordt omgezet naar `allowlist`, vult het `groupAllowFrom` vanuit
  het opgeslagen `allowFrom`-bestand wanneer die lijst bestaat en de configuratie nog niet
  `allowFrom` definieert
- zet `logging.redactSensitive` van `"off"` naar `"tools"`
- scherpt machtigingen aan voor state/config en veelvoorkomende gevoelige bestanden
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sessie-
  `*.jsonl`)
- scherpt ook configuratie-include-bestanden aan waarnaar wordt verwezen vanuit `openclaw.json`
- gebruikt `chmod` op POSIX-hosts en `icacls`-resets op Windows

`--fix` doet **niet** het volgende:

- tokens/wachtwoorden/API-sleutels roteren
- tools uitschakelen (`gateway`, `cron`, `exec`, enz.)
- gateway-keuzes voor binding/authenticatie/netwerkblootstelling wijzigen
- Plugins/Skills verwijderen of herschrijven

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Beveiligingsaudit](/nl/gateway/security)
