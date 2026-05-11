---
read_when:
    - Je wilt dat OpenClaw-agents in Codex-modus native Codex-plugins gebruiken
    - Je migreert vanuit bron geïnstalleerde, door OpenAI gecureerde Codex-plugins
    - Je lost problemen op met codexPlugins, app-inventaris, destructieve acties of diagnostiek voor Plugin-apps
summary: Gemigreerde native Codex-plugins configureren voor OpenClaw-agenten in Codex-modus
title: Native Codex-plugins
x-i18n:
    generated_at: "2026-05-11T20:39:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64e8f552e65b3f1c1c62bc1ba1abfc1bf592d1bdc7fbbe2a484f3eb9955159f0
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Native ondersteuning voor Codex-plugins laat een OpenClaw-agent in Codex-modus de eigen app- en pluginmogelijkheden van Codex app-server gebruiken binnen dezelfde Codex-thread die de OpenClaw-beurt afhandelt.

OpenClaw vertaalt Codex-plugins niet naar synthetische dynamische OpenClaw-tools `codex_plugin_*`. Plugin-aanroepen blijven in het native Codex-transcript en Codex app-server is eigenaar van de app-ondersteunde MCP-uitvoering.

Gebruik deze pagina nadat de basis-[Codex-harness](/nl/plugins/codex-harness) werkt.

## Vereisten

- De geselecteerde runtime van de OpenClaw-agent moet de native Codex-harness zijn.
- `plugins.entries.codex.enabled` moet true zijn.
- `plugins.entries.codex.config.codexPlugins.enabled` moet true zijn.
- V1 ondersteunt alleen `openai-curated` plugins waarvan de migratie heeft gezien dat ze als bron zijn geinstalleerd in de Codex-thuismap van de bron.
- De doel-Codex app-server moet de verwachte marketplace-, plugin- en app-inventaris kunnen zien.

`codexPlugins` heeft geen effect op PI-uitvoeringen, normale OpenAI-provideruitvoeringen, ACP-gespreksbindingen of andere harnesses, omdat die paden geen Codex app-server-threads met native `apps`-configuratie maken.

## Snelstart

Bekijk een voorbeeld van migratie vanuit de Codex-thuismap van de bron:

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
            allow_destructive_actions: false,
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

Gebruik na het wijzigen van `codexPlugins` `/new`, `/reset`, of herstart de gateway zodat toekomstige Codex-harness-sessies met de bijgewerkte app-set starten.

## Hoe native pluginconfiguratie werkt

De integratie heeft drie afzonderlijke statussen:

- Geinstalleerd: Codex heeft de lokale pluginbundel in de doelruntime van app-server.
- Ingeschakeld: OpenClaw-configuratie is bereid de plugin beschikbaar te maken voor Codex-harness-beurten.
- Toegankelijk: Codex app-server bevestigt dat de app-vermeldingen van de plugin beschikbaar zijn voor het actieve account en kunnen worden gekoppeld aan de gemigreerde pluginidentiteit.

Migratie is de duurzame installatie- en geschiktheidsstap. Runtime-appinventaris is de toegankelijkheidscontrole. De sessieconfiguratie van de Codex-harness berekent vervolgens een beperkende thread-appconfiguratie voor de ingeschakelde en toegankelijke plugin-apps.

Thread-appconfiguratie wordt berekend wanneer OpenClaw een Codex-harness-sessie tot stand brengt of een verouderde Codex-threadbinding vervangt. Deze wordt niet bij elke beurt opnieuw berekend.

## Ondersteuningsgrens van V1

V1 is bewust smal:

- Alleen `openai-curated` plugins die al waren geinstalleerd in de app-server-inventaris van de Codex-bron komen in aanmerking voor migratie.
- Migratie schrijft expliciete pluginidentiteiten met `marketplaceName` en `pluginName`; ze schrijft geen lokale `marketplacePath`-cachepaden.
- `codexPlugins.enabled` is de globale inschakelknop.
- Er is geen wildcard `plugins["*"]` en geen configuratiesleutel die willekeurige installatiemachtiging verleent.
- Niet-ondersteunde marketplaces, gecachete pluginbundels, hooks en Codex-configuratiebestanden worden bewaard in het migratierapport voor handmatige beoordeling.

## App-inventaris en eigenaarschap

OpenClaw leest Codex-appinventaris via app-server `app/list`, cachet deze een uur en vernieuwt verouderde of ontbrekende vermeldingen asynchroon.

Een plugin-app wordt alleen blootgesteld wanneer OpenClaw deze via stabiel eigenaarschap kan terugkoppelen aan de gemigreerde plugin:

- exacte app-id uit plugindetail
- bekende MCP-servernaam
- unieke stabiele metadata

Eigenaarschap op basis van alleen weergavenaam of ambigu eigenaarschap wordt uitgesloten totdat de volgende inventarisvernieuwing eigenaarschap bewijst.

## Thread-appconfiguratie

OpenClaw injecteert een beperkende `config.apps`-patch voor de Codex-thread: `_default` is uitgeschakeld en alleen apps die eigendom zijn van ingeschakelde gemigreerde plugins worden ingeschakeld.

OpenClaw stelt appniveau `destructive_enabled` in op basis van het effectieve globale of per-pluginbeleid `allow_destructive_actions` en laat Codex destructieve toolmetadata afdwingen vanuit de native app-toolannotaties. De `_default`-appconfiguratie wordt uitgeschakeld met `open_world_enabled: false`. Ingeschakelde plugin-apps worden uitgegeven met `open_world_enabled: true`; OpenClaw biedt geen afzonderlijke beleidsknop voor plugin-open-world en onderhoudt geen per-plugin weigerlijsten voor destructieve toolnamen.

De toolgoedkeuringsmodus is standaard automatisch voor plugin-apps, zodat niet-destructieve leestools kunnen worden uitgevoerd zonder goedkeurings-UI in dezelfde thread. Destructieve tools blijven beheerst door het beleid `destructive_enabled` van elke app.

## Beleid voor destructieve acties

Destructieve plugin-elicitations falen standaard gesloten:

- Globale `allow_destructive_actions` staat standaard op `false`.
- Per-plugin `allow_destructive_actions` overschrijft het globale beleid voor die plugin.
- Wanneer beleid `false` is, retourneert OpenClaw een deterministische weigering.
- Wanneer beleid `true` is, accepteert OpenClaw automatisch alleen veilige schema's die het kan koppelen aan een goedkeuringsrespons, zoals een booleaans goedkeuringsveld.
- Ontbrekende pluginidentiteit, ambigu eigenaarschap, een ontbrekende beurt-id, een verkeerde beurt-id of een onveilig elicitation-schema leidt tot weigering in plaats van een prompt.

## Problemen oplossen

**`auth_required`:** migratie heeft de plugin geinstalleerd, maar een van de apps heeft nog authenticatie nodig. De expliciete pluginvermelding wordt uitgeschakeld geschreven totdat je opnieuw autoriseert en deze inschakelt.

**`marketplace_missing` of `plugin_missing`:** de doel-Codex app-server kan de verwachte `openai-curated` marketplace of plugin niet zien. Voer migratie opnieuw uit tegen de doelruntime of inspecteer de pluginstatus van Codex app-server.

**`app_inventory_missing` of `app_inventory_stale`:** appgereedheid kwam uit een lege of verouderde cache. OpenClaw plant een asynchrone vernieuwing en sluit plugin-apps uit totdat eigenaarschap en gereedheid bekend zijn.

**`app_ownership_ambiguous`:** app-inventaris kwam alleen overeen op weergavenaam, dus de app wordt niet blootgesteld aan de Codex-thread.

**Configuratie gewijzigd maar de agent kan de plugin niet zien:** gebruik `/new`, `/reset`, of herstart de gateway. Bestaande Codex-threadbindingen behouden de appconfiguratie waarmee ze zijn gestart totdat OpenClaw een nieuwe harness-sessie tot stand brengt of een verouderde binding vervangt.

**Destructieve actie wordt geweigerd:** controleer de globale en per-pluginwaarden van `allow_destructive_actions`. Zelfs wanneer beleid true is, falen onveilige elicitation-schema's en ambigue pluginidentiteit nog steeds gesloten.

## Gerelateerd

- [Codex-harness](/nl/plugins/codex-harness)
- [Codex-harnessreferentie](/nl/plugins/codex-harness-reference)
- [Codex-harnessruntime](/nl/plugins/codex-harness-runtime)
- [Configuratiereferentie](/nl/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrate CLI](/nl/cli/migrate)
