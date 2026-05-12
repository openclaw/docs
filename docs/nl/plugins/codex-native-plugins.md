---
read_when:
    - Je wilt dat OpenClaw-agenten in Codex-modus systeemeigen Codex-plugins gebruiken
    - Je migreert vanuit de bron geïnstalleerde, door OpenAI samengestelde Codex-plugins
    - Je lost problemen op met codexPlugins, app-inventaris, destructieve acties of diagnostiek voor Plugin-apps
summary: Gemigreerde systeemeigen Codex-plugins configureren voor OpenClaw-agents in Codex-modus
title: Systeemeigen Codex-plugins
x-i18n:
    generated_at: "2026-05-12T00:59:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4cc1c7b6a97c6eb27eb10a7b14261ecfd398eff58fbd26cc2979a31e6f6a6c4
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Native Codex Plugin-ondersteuning laat een OpenClaw-agent in Codex-modus de eigen app- en Plugin-mogelijkheden van Codex app-server gebruiken binnen dezelfde Codex-thread die de OpenClaw-beurt afhandelt.

OpenClaw vertaalt Codex-plugins niet naar synthetische `codex_plugin_*` dynamische OpenClaw-tools. Plugin-aanroepen blijven in het native Codex-transcript, en Codex app-server is eigenaar van de app-ondersteunde MCP-uitvoering.

Gebruik deze pagina nadat de basis-[Codex harness](/nl/plugins/codex-harness) werkt.

## Vereisten

- De geselecteerde OpenClaw-agentruntime moet de native Codex harness zijn.
- `plugins.entries.codex.enabled` moet true zijn.
- `plugins.entries.codex.config.codexPlugins.enabled` moet true zijn.
- V1 ondersteunt alleen `openai-curated` plugins waarvan migratie heeft vastgesteld dat ze als bron zijn geïnstalleerd in de bron-Codex-home.
- De doel-Codex app-server moet de verwachte marketplace-, Plugin- en app-inventaris kunnen zien.

`codexPlugins` heeft geen effect op PI-runs, normale OpenAI-provider-runs, ACP-gespreksbindingen of andere harnesses, omdat die paden geen Codex app-server-threads met native `apps`-configuratie maken.

## Snelstart

Bekijk een voorbeeld van migratie vanuit de bron-Codex-home:

```bash
openclaw migrate codex --dry-run
```

Pas de migratie toe wanneer het plan er goed uitziet:

```bash
openclaw migrate apply codex --yes
```

Migratie schrijft expliciete `codexPlugins`-vermeldingen voor in aanmerking komende plugins en roept Codex app-server `plugin/install` aan voor geselecteerde plugins. Een typische gemigreerde configuratie ziet er zo uit:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

Gebruik na het wijzigen van `codexPlugins` `/new`, `/reset`, of herstart de Gateway zodat toekomstige Codex harness-sessies starten met de bijgewerkte app-set.

## Hoe native Plugin-installatie werkt

De integratie heeft drie afzonderlijke statussen:

- Geïnstalleerd: Codex heeft de lokale Plugin-bundel in de doel-app-serverruntime.
- Ingeschakeld: OpenClaw-configuratie is bereid de Plugin beschikbaar te maken voor Codex harness-beurten.
- Toegankelijk: Codex app-server bevestigt dat de app-vermeldingen van de Plugin beschikbaar zijn voor het actieve account en kunnen worden toegewezen aan de gemigreerde Plugin-identiteit.

Migratie is de duurzame installatie- en geschiktheidsstap. Runtime-app-inventaris is de toegankelijkheidscontrole. Codex harness-sessie-instelling berekent vervolgens een beperkende thread-appconfiguratie voor de ingeschakelde en toegankelijke Plugin-apps.

Thread-appconfiguratie wordt berekend wanneer OpenClaw een Codex harness-sessie tot stand brengt of een verouderde Codex-threadbinding vervangt. Deze wordt niet bij elke beurt opnieuw berekend.

## V1-ondersteuningsgrens

V1 is bewust beperkt:

- Alleen `openai-curated` plugins die al waren geïnstalleerd in de bron-Codex app-server-inventaris komen in aanmerking voor migratie.
- Migratie schrijft expliciete Plugin-identiteiten met `marketplaceName` en `pluginName`; het schrijft geen lokale `marketplacePath`-cachepaden.
- `codexPlugins.enabled` is de globale activeringsschakelaar.
- Er is geen `plugins["*"]`-wildcard en geen configuratiesleutel die willekeurige installatiebevoegdheid verleent.
- Niet-ondersteunde marketplaces, gecachete Plugin-bundels, hooks en Codex-configuratiebestanden blijven behouden in het migratierapport voor handmatige beoordeling.

## App-inventaris en eigenaarschap

OpenClaw leest Codex-app-inventaris via app-server `app/list`, cachet deze een uur en vernieuwt verouderde of ontbrekende vermeldingen asynchroon.

Een Plugin-app wordt alleen beschikbaar gemaakt wanneer OpenClaw deze via stabiel eigenaarschap kan herleiden naar de gemigreerde Plugin:

- exacte app-id uit Plugin-detail
- bekende MCP-servernaam
- unieke stabiele metadata

Alleen op weergavenaam gebaseerd of ambigu eigenaarschap wordt uitgesloten totdat de volgende inventarisvernieuwing het eigenaarschap bewijst.

## Thread-appconfiguratie

OpenClaw injecteert een beperkende `config.apps`-patch voor de Codex-thread: `_default` is uitgeschakeld en alleen apps die eigendom zijn van ingeschakelde gemigreerde plugins worden ingeschakeld.

OpenClaw stelt app-niveau `destructive_enabled` in op basis van het effectieve globale of per-Plugin `allow_destructive_actions`-beleid en laat Codex destructieve toolmetadata afdwingen via de native app-toolannotaties. De `_default`-appconfiguratie is uitgeschakeld met `open_world_enabled: false`. Ingeschakelde Plugin-apps worden uitgegeven met `open_world_enabled: true`; OpenClaw biedt geen afzonderlijke Plugin-open-world-beleidsknop en onderhoudt geen per-Plugin ontzeglijsten voor destructieve toolnamen.

Toolgoedkeuringsmodus is standaard automatisch voor Plugin-apps, zodat niet-destructieve leestools kunnen worden uitgevoerd zonder goedkeuringsinterface in dezelfde thread. Destructieve tools blijven beheerd door het `destructive_enabled`-beleid van elke app.

## Beleid voor destructieve acties

Destructieve Plugin-elicitations zijn standaard toegestaan voor gemigreerde Codex-plugins, terwijl onveilige schema's en ambigu eigenaarschap nog steeds gesloten falen:

- Globale `allow_destructive_actions` is standaard `true`.
- Per-Plugin `allow_destructive_actions` overschrijft het globale beleid voor die Plugin.
- Wanneer beleid `false` is, retourneert OpenClaw een deterministische weigering.
- Wanneer beleid `true` is, accepteert OpenClaw automatisch alleen veilige schema's die het kan toewijzen aan een goedkeuringsantwoord, zoals een booleaans goedkeuringsveld.
- Ontbrekende Plugin-identiteit, ambigu eigenaarschap, een ontbrekende beurt-id, een verkeerde beurt-id of een onveilig elicitation-schema weigert in plaats van te vragen.

## Probleemoplossing

**`auth_required`:** migratie heeft de Plugin geïnstalleerd, maar een van de apps heeft nog steeds authenticatie nodig. De expliciete Plugin-vermelding wordt uitgeschakeld geschreven totdat je opnieuw autoriseert en deze inschakelt.

**`marketplace_missing` of `plugin_missing`:** de doel-Codex app-server kan de verwachte `openai-curated` marketplace of Plugin niet zien. Voer migratie opnieuw uit tegen de doelruntime of inspecteer de Plugin-status van Codex app-server.

**`app_inventory_missing` of `app_inventory_stale`:** app-gereedheid kwam uit een lege of verouderde cache. OpenClaw plant een async-vernieuwing en sluit Plugin-apps uit totdat eigenaarschap en gereedheid bekend zijn.

**`app_ownership_ambiguous`:** app-inventaris kwam alleen overeen op weergavenaam, dus de app wordt niet beschikbaar gemaakt voor de Codex-thread.

**Configuratie gewijzigd maar de agent kan de Plugin niet zien:** gebruik `/new`, `/reset`, of herstart de Gateway. Bestaande Codex-threadbindingen behouden de appconfiguratie waarmee ze zijn gestart totdat OpenClaw een nieuwe harness-sessie tot stand brengt of een verouderde binding vervangt.

**Destructieve actie wordt geweigerd:** controleer de globale en per-Plugin `allow_destructive_actions`-waarden. Zelfs wanneer beleid true is, falen onveilige elicitation-schema's en ambigue Plugin-identiteit nog steeds gesloten.

## Gerelateerd

- [Codex harness](/nl/plugins/codex-harness)
- [Codex harness-referentie](/nl/plugins/codex-harness-reference)
- [Codex harness-runtime](/nl/plugins/codex-harness-runtime)
- [Configuratiereferentie](/nl/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrate CLI](/nl/cli/migrate)
