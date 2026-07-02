---
read_when:
    - Je wilt dat OpenClaw-agenten in Codex-modus native Codex-plugins gebruiken
    - Je migreert brongeïnstalleerde, door OpenAI samengestelde Codex-Plugins
    - Je lost problemen op met codexPlugins, app-inventaris, destructieve acties of Plugin-appdiagnostiek
summary: Gemigreerde native Codex-Plugins configureren voor OpenClaw-agenten in Codex-modus
title: Native Codex-plugins
x-i18n:
    generated_at: "2026-07-02T01:03:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 11a883137ba89936cf564a45b22c9e76097af669e2ef6c70c8c710bb2b79d3c0
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Native ondersteuning voor Codex-Plugins laat een OpenClaw-agent in Codex-modus de eigen app- en Plugin-mogelijkheden van Codex app-server gebruiken binnen dezelfde Codex-thread die de OpenClaw-beurt afhandelt.

OpenClaw vertaalt Codex-Plugins niet naar synthetische dynamische OpenClaw-tools met `codex_plugin_*`. Plugin-aanroepen blijven in het native Codex-transcript, en Codex app-server is eigenaar van de app-ondersteunde MCP-uitvoering.

Gebruik deze pagina nadat de basis-[Codex-harness](/nl/plugins/codex-harness) werkt.

## Vereisten

- De geselecteerde OpenClaw-agentruntime moet de native Codex-harness zijn.
- `plugins.entries.codex.enabled` moet true zijn.
- `plugins.entries.codex.config.codexPlugins.enabled` moet true zijn.
- V1 ondersteunt alleen `openai-curated`-Plugins die de migratie als brongeïnstalleerd in de bron-Codex-home heeft waargenomen.
- De doel-Codex app-server moet de verwachte marketplace-, Plugin- en app-inventaris kunnen zien.

`codexPlugins` heeft geen effect op OpenClaw-runs, normale OpenAI-provider-runs, ACP-gesprekskoppelingen of andere harnesses, omdat die paden geen Codex app-server-threads met native `apps`-configuratie maken.

Codex-toegang aan OpenAI-zijde, app-beschikbaarheid en werkruimtecontroles voor apps/Plugins komen van het aangemelde Codex-account. Zie voor het OpenAI-account- en beheermodel [Codex gebruiken met je ChatGPT-plan](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Snelstart

Bekijk een voorbeeld van de migratie vanuit de bron-Codex-home:

```bash
openclaw migrate codex --dry-run
```

Gebruik strikte verificatie van bron-apps wanneer je wilt dat migratie de toegankelijkheid van bron-apps controleert voordat native Plugin-activering wordt gepland:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Pas de migratie toe wanneer het plan klopt:

```bash
openclaw migrate apply codex --yes
```

Migratie schrijft expliciete `codexPlugins`-vermeldingen voor in aanmerking komende Plugins en roept Codex app-server `plugin/install` aan voor geselecteerde Plugins. Een typische gemigreerde configuratie ziet er zo uit:

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

Na het wijzigen van `codexPlugins` nemen nieuwe Codex-gesprekken automatisch de bijgewerkte app-set over. Gebruik `/new` of `/reset` om het huidige gesprek te vernieuwen. Een Gateway-herstart is niet vereist om Plugins in of uit te schakelen.

## Plugins beheren vanuit chat

Gebruik `/codex plugins` wanneer je native Codex-Plugins vanuit dezelfde chat wilt inspecteren of wijzigen waarin je de Codex-harness bedient:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` is een alias voor `/codex plugins list`. De lijstuitvoer toont de geconfigureerde Plugin-sleutels, aan/uit-status, Codex-Pluginnaam en marketplace uit `plugins.entries.codex.config.codexPlugins.plugins`.

`enable` en `disable` schrijven alleen naar de OpenClaw-configuratie op `~/.openclaw/openclaw.json`; ze bewerken `~/.codex/config.toml` niet en installeren geen nieuwe Codex-Plugins. Alleen de eigenaar of een Gateway-client met het bereik `operator.admin` kan de Plugin-status wijzigen.

Het inschakelen van een geconfigureerde Plugin schakelt ook de globale `codexPlugins.enabled`-schakelaar in. Als de Plugin uitgeschakeld is geschreven omdat migratie `auth_required` retourneerde, autoriseer de app dan opnieuw in Codex voordat je deze in OpenClaw inschakelt.

## Hoe native Plugin-instelling werkt

De integratie heeft drie afzonderlijke toestanden:

- Geïnstalleerd: Codex heeft de lokale Plugin-bundel in de doel-app-serverruntime.
- Ingeschakeld: OpenClaw-configuratie is bereid de Plugin beschikbaar te maken voor Codex-harnessbeurten.
- Toegankelijk: Codex app-server bevestigt dat de app-vermeldingen van de Plugin beschikbaar zijn voor het actieve account en aan de gemigreerde Plugin-identiteit kunnen worden gekoppeld.

Migratie is de duurzame installatie-/geschiktheidsstap. Tijdens de planning leest OpenClaw bron-Codex `plugin/read`-details en controleert of de accountrespons van de bron-Codex app-server een ChatGPT-abonnementsaccount is. Niet-ChatGPT- of ontbrekende accountresponsen slaan app-ondersteunde Plugins over met `codex_subscription_required`. Standaard roept migratie geen bron-`app/list` aan; app-ondersteunde bron-Plugins die de accountpoort passeren, worden gepland zonder verificatie van bron-app-toegankelijkheid, en transportfouten bij accountopzoeking worden overgeslagen met `codex_account_unavailable`. Met `--verify-plugin-apps` maakt migratie een nieuwe bron-`app/list`-momentopname en vereist dat elke beheerde app aanwezig, ingeschakeld en toegankelijk is voordat native activering wordt gepland. In die modus vallen transportfouten bij accountopzoeking door naar de bron-app-inventarispoort. Runtime-app-inventaris is de toegankelijkheidscontrole voor de doelsessie na migratie. De sessie-instelling van de Codex-harness berekent vervolgens een beperkende thread-app-configuratie voor de ingeschakelde en toegankelijke Plugin-apps.

Thread-app-configuratie wordt berekend wanneer OpenClaw een Codex-harnesssessie tot stand brengt of een verouderde Codex-threadkoppeling vervangt. Deze wordt niet bij elke beurt opnieuw berekend, dus `/codex plugins enable` en `/codex plugins disable` beïnvloeden nieuwe Codex-gesprekken. Gebruik `/new` of `/reset` wanneer het huidige gesprek de bijgewerkte app-set moet overnemen.

## V1-ondersteuningsgrens

V1 is bewust smal:

- Alleen `openai-curated`-Plugins die al in de bron-Codex app-server-inventaris waren geïnstalleerd, komen in aanmerking voor migratie.
- App-ondersteunde bron-Plugins moeten de abonnementspoort tijdens migratie passeren. `--verify-plugin-apps` voegt de bron-app-inventarispoort toe. Accounts met abonnementspoort en, in verificatiemodus, ontoegankelijke, uitgeschakelde of ontbrekende bron-apps of fouten bij het vernieuwen van de bron-app-inventaris worden gerapporteerd als overgeslagen handmatige items in plaats van ingeschakelde configuratievermeldingen. Onleesbare Plugin-details worden vóór de bron-app-inventarispoort overgeslagen.
- Migratie schrijft expliciete Plugin-identiteiten met `marketplaceName` en `pluginName`; het schrijft geen lokale `marketplacePath`-cachepaden.
- `codexPlugins.enabled` is de globale inschakelingsschakelaar.
- Er is geen `plugins["*"]`-wildcard en geen configuratiesleutel die willekeurige installatiebevoegdheid verleent.
- Niet-ondersteunde marketplaces, gecachte Plugin-bundels, hooks en Codex-configuratiebestanden blijven behouden in het migratierapport voor handmatige beoordeling.

## App-inventaris en eigendom

OpenClaw leest Codex-app-inventaris via app-server `app/list`, cachet deze één uur en vernieuwt verouderde of ontbrekende vermeldingen asynchroon. De cache bestaat alleen in geheugen; het herstarten van de CLI of Gateway verwijdert deze, en OpenClaw bouwt deze opnieuw op vanaf de volgende `app/list`-lezing.

Migratie en runtime gebruiken afzonderlijke cachesleutels:

- Bronmigratieverificatie gebruikt de bron-Codex-home en startopties van de bron-app-server. Dit draait alleen wanneer `--verify-plugin-apps` is ingesteld, en het forceert een nieuwe bron-`app/list`-traversal voor die planningsrun.
- Doelruntime-instelling gebruikt de Codex app-server-identiteit van de doelagent wanneer de Codex-thread-app-configuratie wordt gebouwd. Plugin-activering maakt die doelcachesleutel ongeldig en vernieuwt deze daarna geforceerd na `plugin/install`.

Een Plugin-app wordt alleen blootgesteld wanneer OpenClaw deze via stabiel eigendom kan terugkoppelen aan de gemigreerde Plugin:

- exact app-id uit Plugin-detail
- bekende MCP-servernaam
- unieke stabiele metadata

Alleen-displaynaam of ambigu eigendom wordt uitgesloten totdat de volgende inventarisvernieuwing eigendom bewijst.

## Thread-app-configuratie

OpenClaw injecteert een beperkende `config.apps`-patch voor de Codex-thread: `_default` is uitgeschakeld en alleen apps die eigendom zijn van ingeschakelde gemigreerde Plugins zijn ingeschakeld.

OpenClaw stelt app-niveau `destructive_enabled` in vanuit het effectieve globale of per-Plugin `allow_destructive_actions`-beleid en laat Codex destructieve toolmetadata afdwingen vanuit de native app-toolannotaties. `true`, `"auto"` en `"ask"` stellen `destructive_enabled: true` in; `false` stelt het in op false. De `_default`-appconfiguratie is uitgeschakeld met `open_world_enabled: false`. Ingeschakelde Plugin-apps worden uitgegeven met `open_world_enabled: true`; OpenClaw stelt geen afzonderlijke Plugin-open-world-beleidsknop beschikbaar en onderhoudt geen per-Plugin deny-lists voor destructieve toolnamen.

De modus voor toolgoedkeuring is standaard automatisch voor Plugin-apps, zodat niet-destructieve leestools kunnen draaien zonder goedkeurings-UI in dezelfde thread. Destructieve tools blijven gecontroleerd door het `destructive_enabled`-beleid van elke app.

## Beleid voor destructieve acties

Destructieve Plugin-elicitations zijn standaard toegestaan voor gemigreerde Codex-Plugins, terwijl onveilige schema's en ambigu eigendom nog steeds fail-closed zijn:

- Globaal `allow_destructive_actions` is standaard `true`.
- Per-Plugin `allow_destructive_actions` overschrijft het globale beleid voor die Plugin.
- Wanneer beleid `false` is, retourneert OpenClaw een deterministische weigering.
- Wanneer beleid `true` is, accepteert OpenClaw automatisch alleen veilige schema's die het aan een goedkeuringsrespons kan koppelen, zoals een boolean approve-veld.
- Wanneer beleid `"auto"` is, stelt OpenClaw destructieve Plugin-acties beschikbaar aan Codex maar zet MCP-goedkeurings-elicitations met bewezen eigendom om in OpenClaw-Plugin-goedkeuringen voordat de Codex-goedkeuringsrespons wordt geretourneerd.
- Wanneer beleid `"ask"` is, gebruikt OpenClaw dezelfde Codex-schrijf-/destructieve gating als `"auto"`, wist duurzame Codex-goedkeuringsoverschrijvingen per tool voor de app voordat de thread start, en biedt alleen een eenmalige goedkeuring of weigering zodat duurzame goedkeuringen latere prompts voor schrijf-acties niet kunnen onderdrukken.
- Voor elke toegelaten app die `"ask"` gebruikt, selecteert OpenClaw de menselijke goedkeuringsreviewer van Codex voor die app, zodat Codex de goedkeurings-elicitations naar OpenClaw stuurt. Andere apps en niet-app-threadgoedkeuringen behouden hun geconfigureerde reviewer en beleid.
- Ontbrekende Plugin-identiteit, ambigu eigendom, een ontbrekend beurt-id, een verkeerd beurt-id of een onveilig elicitation-schema weigert in plaats van te prompten.

## Probleemoplossing

**`auth_required`:** migratie heeft de Plugin geïnstalleerd, maar een van de apps heeft nog authenticatie nodig. De expliciete Plugin-vermelding wordt uitgeschakeld geschreven totdat je opnieuw autoriseert en deze inschakelt.

**`app_inaccessible`, `app_disabled` of `app_missing`:**
migratie heeft de Plugin niet geïnstalleerd omdat de bron-Codex-app-inventaris niet alle beheerde apps als aanwezig, ingeschakeld en toegankelijk toonde terwijl `--verify-plugin-apps` was ingesteld. Autoriseer of schakel de app opnieuw in Codex in en voer de migratie daarna opnieuw uit met `--verify-plugin-apps`.

**`app_inventory_unavailable`:** migratie heeft de Plugin niet geïnstalleerd omdat strikte verificatie van bron-apps was aangevraagd en het vernieuwen van de bron-Codex-app-inventaris mislukte. Herstel toegang tot de bron-Codex app-server of probeer opnieuw zonder `--verify-plugin-apps` als je het snellere account-gated plan accepteert.

**`codex_subscription_required`:** migratie heeft de app-ondersteunde Plugin niet geïnstalleerd omdat het bron-Codex app-server-account niet was aangemeld met een ChatGPT-abonnementsaccount. Meld je aan bij de Codex-app met abonnementsauthenticatie en voer de migratie daarna opnieuw uit.

**`codex_account_unavailable`:** migratie heeft de app-ondersteunde Plugin niet geïnstalleerd omdat het bron-Codex app-server-account niet kon worden gelezen. Herstel bron-Codex app-server-authenticatie of voer opnieuw uit met `--verify-plugin-apps` als je wilt dat bron-app-inventaris de geschiktheid bepaalt wanneer accountopzoeking mislukt.

**`marketplace_missing` of `plugin_missing`:** de doel-Codex app-server kan de verwachte `openai-curated`-marketplace of Plugin niet zien. Voer migratie opnieuw uit tegen de doelruntime of inspecteer de Plugin-status van Codex app-server.

**`app_inventory_missing` of `app_inventory_stale`:** app-gereedheid kwam uit een lege of verouderde cache. OpenClaw plant een asynchrone vernieuwing en sluit Plugin-apps uit totdat eigendom en gereedheid bekend zijn.

**`app_ownership_ambiguous`:** app-inventaris kwam alleen overeen op displaynaam, dus de app wordt niet blootgesteld aan de Codex-thread.

**Configuratie gewijzigd, maar de agent kan de Plugin niet zien:** gebruik `/codex plugins
list` om de geconfigureerde status te bevestigen, en gebruik daarna `/new` of `/reset`. Bestaande
Codex-threadbindingen behouden de appconfiguratie waarmee ze zijn gestart totdat OpenClaw
een nieuwe harness-sessie tot stand brengt of een verouderde binding vervangt.

**Destructieve actie wordt geweigerd:** controleer de globale en per-Plugin
`allow_destructive_actions`-waarden. Zelfs wanneer het beleid true, `"auto"` of
`"ask"` is, falen onveilige elicitatieschema's en een dubbelzinnige Plugin-identiteit nog steeds
gesloten.

## Gerelateerd

- [Codex-harness](/nl/plugins/codex-harness)
- [Codex-harnessreferentie](/nl/plugins/codex-harness-reference)
- [Codex-harnessruntime](/nl/plugins/codex-harness-runtime)
- [Configuratiereferentie](/nl/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI migreren](/nl/cli/migrate)
