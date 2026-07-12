---
read_when:
    - U installeert, configureert of controleert de beleidsplugin
summary: Voegt door beleid ondersteunde doctor-controles toe voor conformiteit van de werkruimte.
title: Beleidsplugin
x-i18n:
    generated_at: "2026-07-12T09:14:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f01de4816a191a175367c06ff69e4ebf6032ee1a105d1d9a48a74093e5e6f774
    source_path: plugins/reference/policy.md
    workflow: 16
---

# Policy-Plugin

Voegt door beleid ondersteunde doctor-controles toe voor naleving binnen de werkruimte.

## Distributie

- Pakket: `@openclaw/policy`
- Installatieroute: inbegrepen in OpenClaw

## Oppervlak

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## Gedrag

De Policy-Plugin levert doctor-statuscontroles voor door beleid beheerde OpenClaw-instellingen en gereguleerde werkruimtedeclaraties. Policy omvat momenteel naleving voor kanalen, gereguleerde metagegevens van tools, de beveiligingsstatus van MCP-servers, modelproviders, toegang tot privénetwerken, Gateway-blootstelling, werkruimten en tools van agents, geconfigureerde algemene tools en tools per agent, de geconfigureerde sandbox-runtime, ingress- en kanaaltoegang, gegevensverwerking en providers van OpenClaw-configuratiegeheimen en verificatieprofielen.

Policy slaat opgestelde vereisten op in `policy.jsonc`, gebruikt bestaande OpenClaw-instellingen en werkruimtedeclaraties als bewijs en rapporteert afwijkingen via `openclaw policy check` en `openclaw doctor --lint`. Een geslaagde beleidscontrole produceert hashes voor het beleid, het bewijs, de bevindingen en de attestatie, die beheerders voor audits kunnen vastleggen.

`openclaw policy compare --baseline <file>` vergelijkt het ene beleidsbestand met het andere. Dit controleert alleen naleving op configuratieniveau: het gebruikt metagegevens van beleidsregels om te verifiëren dat het gecontroleerde beleid niets mist en niet zwakker is dan de opgestelde basislijn. Het inspecteert geen runtimestatus, aanmeldgegevens of waarden van geheimen.

Regels voor de beveiligingsstatus van tools kunnen goedgekeurde profielen, uitsluitend tot de werkruimte beperkte bestandssysteemtools, begrensde instellingen voor exec-beveiliging, vragen en hosts, een uitgeschakelde verhoogde modus, exacte `alsoAllow`-vermeldingen en vereiste toolweigeringen voorschrijven. Het bewijs registreert aanvullende `alsoAllow`-vermeldingen, omdat deze de effectieve beveiligingsstatus van tools kunnen verruimen. Deze controles observeren alleen naleving van de configuratie; ze lezen geen goedkeuringsstatus van de runtime en voegen geen runtimehandhaving toe.

Regels voor de sandboxstatus kunnen goedgekeurde sandboxmodi en -backends voorschrijven, hostnetwerken voor containers en deelname aan containernamespaces verbieden, alleen-lezencontainermounts vereisen, mounts van sockets voor containerruntimes en onbeperkte containerprofielen verbieden, en bronbereiken voor CDP van de sandboxbrowser vereisen.
Deze controles observeren alleen naleving van de configuratie; ze lezen geen goedkeuringsstatus van de runtime, inspecteren geen actieve containers en voegen geen runtimehandhaving toe.

Regels voor gegevensverwerking kunnen redactie van gevoelige loggegevens voorschrijven, het vastleggen van inhoud voor telemetrie verbieden, onderhoud van sessiebewaring vereisen en geheugenindexering van sessietranscripten verbieden. Deze controles observeren alleen naleving van de configuratie; ze inspecteren geen onbewerkte logboeken, telemetrie-exports, transcripten, geheugenbestanden, geheimen of persoonsgegevens.

Benoemde beleidsbereiken onder `scopes.<scopeName>` kunnen strengere reguliere beleidssecties toevoegen voor de selector die ze vermelden. `agentIds` ondersteunt `tools`, `agents.workspace`, `sandbox` en `dataHandling.memory`; `channelIds` ondersteunt `ingress.channels`.
Runtime-agent-ID's die niet expliciet in `agents.list[]` staan, worden gecontroleerd aan de hand van de overgenomen algemene of standaardbeveiligingsstatus, in plaats van stilzwijgend zonder bewijs te slagen. Elk bereik in `policy.jsonc` moet geldig en afdwingbaar zijn voor de bijbehorende selector. Overlayregels zijn aanvullende claims; ze verzwakken het beleid op het hoogste niveau daarom niet en kunnen eigen bevindingen opleveren wanneer dezelfde geobserveerde configuratie beide bereiken schendt.

<!-- openclaw-plugin-reference:manual-end -->

## Gerelateerde documentatie

- [beleid](/nl/cli/policy)
