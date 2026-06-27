---
read_when:
    - Je installeert, configureert of controleert de Plugin voor beleid
summary: Voegt door beleid ondersteunde doctor-controles toe voor workspace-conformiteit.
title: Beleidsplugin
x-i18n:
    generated_at: "2026-06-27T18:03:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f01de4816a191a175367c06ff69e4ebf6032ee1a105d1d9a48a74093e5e6f774
    source_path: plugins/reference/policy.md
    workflow: 16
---

# Policy Plugin

Voegt door beleid ondersteunde doctor-controles toe voor werkruimteconformiteit.

## Distributie

- Pakket: `@openclaw/policy`
- Installatieroute: opgenomen in OpenClaw

## Oppervlak

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## Gedrag

De Policy Plugin levert doctor-gezondheidscontroles voor door beleid beheerde OpenClaw-instellingen en gereguleerde werkruimteverklaringen. Beleid dekt momenteel kanaalconformiteit, gereguleerde hulpmiddelmetadata, MCP-serverpostuur, modelproviderpostuur, toegangspositie voor privénetwerken, Gateway-blootstellingspostuur, agentwerkruimte-/hulpmiddelpostuur, geconfigureerde globale/per-agent-hulpmiddelpostuur, geconfigureerde sandbox-runtimepostuur, ingress-/kanaaltoegangspostuur, gegevensverwerkingspostuur en OpenClaw-configuratiepostuur voor geheime-provider-/auth-profielen.

Beleid slaat opgestelde vereisten op in `policy.jsonc`, observeert bestaande OpenClaw-instellingen en werkruimteverklaringen als bewijs, en rapporteert afwijkingen via `openclaw policy check` en `openclaw doctor --lint`. Een schone beleidscontrole geeft beleid, bewijs, bevindingen en attestatiehashes uit die operators kunnen vastleggen voor audits.

`openclaw policy compare --baseline <file>` vergelijkt één beleidsbestand met een ander beleidsbestand. Dit is alleen conformiteit op configuratieniveau: het gebruikt metadata van beleidsregels om te verifiëren dat het gecontroleerde beleid niet ontbreekt of zwakker is dan de opgestelde basislijn, en het inspecteert geen runtimestatus, inloggegevens of geheime waarden.

Regels voor hulpmiddelpostuur kunnen goedgekeurde profielen, bestandssysteemhulpmiddelen die alleen voor de werkruimte gelden, begrensde exec-beveiligings-/vraag-/hostinstellingen, uitgeschakelde verhoogde modus, exacte `alsoAllow`-vermeldingen en vereiste weigeringen voor hulpmiddelen vereisen. Het bewijs registreert aanvullende `alsoAllow`-vermeldingen, omdat ze de effectieve hulpmiddelpostuur kunnen verruimen. Deze controles observeren alleen configuratieconformiteit; ze lezen geen runtime-goedkeuringsstatus en voegen geen runtimehandhaving toe.

Regels voor sandboxpostuur kunnen goedgekeurde sandboxmodi/-backends vereisen, hostcontainernetwerken weigeren, joins met containernamespaces weigeren, alleen-lezen containermounts vereisen, mounts van containerruntime-sockets en onbegrensde containerprofielen weigeren, en bronbereiken voor sandbox-browser-CDP vereisen.
Deze controles observeren alleen configuratieconformiteit; ze lezen geen runtime-goedkeuringsstatus, inspecteren geen live containers en voegen geen runtimehandhaving toe.

Regels voor gegevensverwerking kunnen redactie van gevoelige logging vereisen, telemetrie-inhoudsvastlegging weigeren, onderhoud van sessieretentie vereisen en geheugenindexering van sessietranscripten weigeren. Deze controles observeren alleen configuratieconformiteit; ze inspecteren geen ruwe logs, telemetrie-exports, transcripties, geheugenbestanden, geheimen of persoonsgegevens.

Benoemde beleidsscopes onder `scopes.<scopeName>` kunnen strengere normale beleidssecties toevoegen voor de selector die ze vermelden. `agentIds` ondersteunt `tools`, `agents.workspace`, `sandbox` en `dataHandling.memory`; `channelIds` ondersteunt `ingress.channels`.
Runtime-agent-id's die niet expliciet in `agents.list[]` staan, worden gecontroleerd tegen geërfde globale/standaardpostuur in plaats van stilzwijgend te slagen zonder bewijs. Elke scope die aanwezig is in `policy.jsonc` moet geldig en afdwingbaar zijn voor de bijbehorende selector. Overlayregels zijn aanvullende claims, dus ze verzwakken het beleid op topniveau niet en kunnen hun eigen bevindingen produceren wanneer dezelfde geobserveerde configuratie beide scopes schendt.

<!-- openclaw-plugin-reference:manual-end -->

## Gerelateerde documentatie

- [beleid](/nl/cli/policy)
