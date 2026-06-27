---
read_when:
    - Je wilt een snelle beveiligingsaudit uitvoeren op configuratie/status
    - Je wilt veilige suggesties voor "fixes" toepassen (machtigingen, standaardinstellingen aanscherpen)
summary: CLI-referentie voor `openclaw security` (veelvoorkomende beveiligingsvalkuilen auditen en oplossen)
title: Beveiliging
x-i18n:
    generated_at: "2026-06-27T17:22:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58876d7ab4dd3e5d3f5c915700b08ca234e5ccefdfc35a79e60a31e1fce21774
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

Gewone `security audit` blijft op het koude config-/bestandssysteem-/alleen-lezen pad. Standaard worden er geen Plugin-runtimebeveiligingscollectors ontdekt, zodat routine-audits niet elke geinstalleerde Plugin-runtime laden. Gebruik `--deep` om best-effort live Gateway-probes en Plugin-eigen beveiligingsauditcollectors mee te nemen; expliciete interne aanroepers kunnen zich ook aanmelden voor die Plugin-eigen collectors wanneer ze al een geschikte runtime-scope hebben.

De audit waarschuwt wanneer meerdere DM-afzenders de hoofdsessie delen en raadt **beveiligde DM-modus** aan: `session.dmScope="per-channel-peer"` (of `per-account-channel-peer` voor kanalen met meerdere accounts) voor gedeelde inboxen.
Dit is bedoeld voor hardening van cooperatieve/gedeelde inboxen. Een enkele Gateway die wordt gedeeld door operators die elkaar niet vertrouwen of vijandig zijn, is geen aanbevolen configuratie; splits vertrouwensgrenzen met afzonderlijke gateways (of afzonderlijke OS-gebruikers/hosts).
De audit geeft ook `security.trust_model.multi_user_heuristic` wanneer de configuratie wijst op waarschijnlijk gedeelde-gebruiker-ingress (bijvoorbeeld open DM-/groepsbeleid, geconfigureerde groepsdoelen of wildcardregels voor afzenders), en herinnert je eraan dat OpenClaw standaard een vertrouwensmodel voor persoonlijke assistenten is.
Voor opzettelijke configuraties met gedeelde gebruikers is het auditadvies om alle sessies te sandboxen, bestandssysteemtoegang tot de workspace te beperken en persoonlijke/prive-identiteiten of referenties buiten die runtime te houden.
De audit waarschuwt ook wanneer kleine modellen (`<=300B`) zonder sandboxing worden gebruikt terwijl web-/browsertools zijn ingeschakeld.
Voor Webhook-ingress logt startup een niet-fatale beveiligingswaarschuwing en markeert de audit hergebruik van `hooks.token` van actieve gedeelde-geheim-authenticatiewaarden van de Gateway, inclusief `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` en `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. De audit waarschuwt ook wanneer:

- `hooks.token` kort is
- `hooks.path="/"`
- `hooks.defaultSessionKey` niet is ingesteld
- `hooks.allowedAgentIds` onbeperkt is
- request-overschrijvingen van `sessionKey` zijn ingeschakeld
- overschrijvingen zijn ingeschakeld zonder `hooks.allowedSessionKeyPrefixes`

Als Gateway-wachtwoordauthenticatie alleen bij startup wordt opgegeven, geef dan dezelfde waarde door aan `openclaw security audit --auth password --password <password>` zodat de audit deze kan controleren tegen `hooks.token`.
Voer `openclaw doctor --fix` uit om een persistent hergebruikt `hooks.token` te roteren, en werk daarna externe hook-afzenders bij zodat ze het nieuwe hook-token gebruiken.

De audit waarschuwt ook wanneer sandbox-Docker-instellingen zijn geconfigureerd terwijl sandboxmodus uit staat, wanneer `gateway.nodes.denyCommands` ineffectieve patroonachtige/onbekende items gebruikt (alleen exacte matching op node-opdrachtnaam, geen shell-tekstfiltering), wanneer `gateway.nodes.allowCommands` expliciet gevaarlijke node-opdrachten inschakelt, wanneer globaal `tools.profile="minimal"` wordt overschreven door agent-toolprofielen, wanneer schrijf-/bewerkingstools zijn uitgeschakeld maar `exec` nog steeds beschikbaar is zonder beperkende sandbox-bestandssysteemgrens, wanneer open DM's of groepen runtime-/bestandssysteemtools blootstellen zonder sandbox-/workspace-bescherming, en wanneer geinstalleerde Plugin-tools bereikbaar kunnen zijn onder permissief toolbeleid.
De audit markeert ook `gateway.allowRealIpFallback=true` (risico op header-spoofing als proxy's verkeerd zijn geconfigureerd) en `discovery.mdns.mode="full"` (metadatalek via mDNS TXT-records).
De audit waarschuwt ook wanneer de sandboxbrowser het Docker-`bridge`-netwerk gebruikt zonder `sandbox.browser.cdpSourceRange`.
De audit markeert ook gevaarlijke sandbox-Docker-netwerkmodi (inclusief `host` en `container:*` namespace-joins).
De audit waarschuwt ook wanneer bestaande sandboxbrowser-Docker-containers ontbrekende/verouderde hashlabels hebben (bijvoorbeeld pre-migratiecontainers zonder `openclaw.browserConfigEpoch`) en raadt `openclaw sandbox recreate --browser --all` aan.
De audit waarschuwt ook wanneer npm-gebaseerde Plugin-/hook-installatierecords niet gepind zijn, integriteitsmetadata missen of afwijken van de momenteel geinstalleerde pakketversies.
De audit waarschuwt wanneer kanaal-allowlists vertrouwen op veranderlijke namen/e-mails/tags in plaats van stabiele ID's (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC-scopes waar van toepassing).
De audit waarschuwt wanneer `gateway.auth.mode="none"` Gateway-HTTP-API's bereikbaar laat zonder gedeeld geheim (`/tools/invoke` plus elk ingeschakeld `/v1/*`-endpoint).
Instellingen met het prefix `dangerous`/`dangerously` zijn expliciete nood-operatoroverschrijvingen; het inschakelen ervan is op zichzelf geen beveiligingskwetsbaarheidsrapport.
Zie voor de volledige inventaris van gevaarlijke parameters de sectie "Samenvatting van onveilige of gevaarlijke vlaggen" in [Beveiliging](/nl/gateway/security).

Opzettelijke blijvende bevindingen kunnen worden geaccepteerd met `security.audit.suppressions`.
Elke suppressie matcht een exacte `checkId` en kan worden vernauwd met
`titleIncludes` en/of `detailIncludes` hoofdletterongevoelige substrings:

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

Onderdrukte bevindingen worden verwijderd uit de actieve lijst `summary` en `findings`.
JSON-uitvoer bewaart ze onder `suppressedFindings` voor auditbaarheid.
Wanneer suppressies zijn geconfigureerd, behoudt actieve uitvoer ook een niet-onderdrukbare
`security.audit.suppressions.active` info-bevinding zodat lezers kunnen zien dat de audit
is gefilterd. Gevaarlijke configuratievlaggen worden als een vlag per bevinding uitgegeven, zodat
het accepteren van een gevaarlijke vlag geen andere ingeschakelde vlaggen verbergt die dezelfde
`config.insecure_or_dangerous_flags` `checkId` delen.
Omdat suppressies blijvend risico kunnen verbergen, vereist het toevoegen of verwijderen ervan via
agent-run shell-opdrachten exec-goedkeuring, tenzij exec al draait
met `security="full"` en `ask="off"` voor vertrouwde lokale automatisering.

SecretRef-gedrag:

- `security audit` lost ondersteunde SecretRefs in alleen-lezen modus op voor de beoogde paden.
- Als een SecretRef niet beschikbaar is in het huidige opdrachtpad, gaat de audit door en rapporteert `secretDiagnostics` (in plaats van te crashen).
- `--token` en `--password` overschrijven alleen deep-probe-authenticatie voor die opdrachtaanroep; ze herschrijven geen configuratie of SecretRef-mappings.

## JSON-uitvoer

Gebruik `--json` voor CI-/beleidscontroles:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Als `--fix` en `--json` worden gecombineerd, bevat de uitvoer zowel fix-acties als het eindrapport:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Wat `--fix` wijzigt

`--fix` past veilige, deterministische remediaties toe:

- zet gangbare `groupPolicy="open"` om naar `groupPolicy="allowlist"` (inclusief accountvarianten in ondersteunde kanalen)
- wanneer WhatsApp-groepsbeleid naar `allowlist` wordt omgezet, vult het `groupAllowFrom` vanuit
  het opgeslagen `allowFrom`-bestand wanneer die lijst bestaat en de configuratie nog geen
  `allowFrom` definieert
- zet `logging.redactSensitive` van `"off"` naar `"tools"`
- verscherpt permissies voor state/config en gangbare gevoelige bestanden
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, sessie-
  `*.jsonl`)
- verscherpt ook config-include-bestanden waarnaar wordt verwezen vanuit `openclaw.json`
- gebruikt `chmod` op POSIX-hosts en `icacls`-resets op Windows

`--fix` doet **niet** het volgende:

- tokens/wachtwoorden/API-sleutels roteren
- tools uitschakelen (`gateway`, `cron`, `exec`, enz.)
- gateway-bind-/auth-/netwerkblootstellingskeuzes wijzigen
- Plugins/Skills verwijderen of herschrijven

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Beveiligingsaudit](/nl/gateway/security)
