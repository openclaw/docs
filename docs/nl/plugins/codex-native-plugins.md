---
read_when:
    - Je wilt dat OpenClaw-agenten in Codex-modus native Codex-plugins gebruiken
    - Je migreert vanuit broncode geïnstalleerde door OpenAI samengestelde Codex-plugins
    - Je lost problemen op met codexPlugins, app-inventaris, destructieve acties of Plugin-appdiagnostiek
summary: Gemigreerde systeemeigen Codex-plugins configureren voor OpenClaw-agents in Codex-modus
title: Systeemeigen Codex-plugins
x-i18n:
    generated_at: "2026-05-12T23:30:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: ddec40cd5f9a74b43d55f327cdcd7088e024392fbafc7f1aa5bd9b136d3ecc13
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Native Codex-Plugin-ondersteuning laat een Codex-modus OpenClaw-agent de eigen app- en Plugin-mogelijkheden van Codex
app-server gebruiken binnen dezelfde Codex-thread die
de OpenClaw-beurt afhandelt.

OpenClaw vertaalt Codex-plugins niet naar synthetische `codex_plugin_*`
dynamische OpenClaw-tools. Plugin-aanroepen blijven in het native Codex-transcript, en
Codex app-server is eigenaar van de app-ondersteunde MCP-uitvoering.

Gebruik deze pagina nadat de basis-[Codex-harness](/nl/plugins/codex-harness) werkt.

## Vereisten

- De geselecteerde OpenClaw-agentruntime moet de native Codex-harness zijn.
- `plugins.entries.codex.enabled` moet true zijn.
- `plugins.entries.codex.config.codexPlugins.enabled` moet true zijn.
- V1 ondersteunt alleen `openai-curated` plugins die volgens de migratie
  als bron-geïnstalleerd in de bron-Codex-home zijn waargenomen.
- De doel-Codex app-server moet de verwachte marketplace-,
  Plugin- en app-inventaris kunnen zien.

`codexPlugins` heeft geen effect op PI-uitvoeringen, normale OpenAI-provideruitvoeringen, ACP
conversatiebindingen of andere harnesses, omdat die paden geen
Codex app-server-threads met native `apps`-config maken.

## Snelstart

Bekijk een migratievoorbeeld vanuit de bron-Codex-home:

```bash
openclaw migrate codex --dry-run
```

Gebruik strikte bronappverificatie wanneer je wilt dat migratie de toegankelijkheid
van bronapps controleert voordat native Plugin-activering wordt gepland:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Pas de migratie toe wanneer het plan er goed uitziet:

```bash
openclaw migrate apply codex --yes
```

Migratie schrijft expliciete `codexPlugins`-vermeldingen voor in aanmerking komende plugins en roept
Codex app-server `plugin/install` aan voor geselecteerde plugins. Een typische gemigreerde
config ziet er zo uit:

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

Gebruik na het wijzigen van `codexPlugins` `/new`, `/reset`, of herstart de Gateway zodat
toekomstige Codex-harnesssessies starten met de bijgewerkte app-set.

## Hoe native Plugin-configuratie werkt

De integratie heeft drie afzonderlijke statussen:

- Geïnstalleerd: Codex heeft de lokale Plugin-bundel in de doel-app-serverruntime.
- Ingeschakeld: OpenClaw-config is bereid de Plugin beschikbaar te maken voor
  Codex-harnessbeurten.
- Toegankelijk: Codex app-server bevestigt dat de app-vermeldingen van de Plugin beschikbaar zijn
  voor het actieve account en kunnen worden gekoppeld aan de gemigreerde Plugin-identiteit.

Migratie is de duurzame installatie-/geschiktheidsstap. Tijdens het plannen leest OpenClaw
bron-Codex `plugin/read`-details en controleert het of de accountrespons van de bron-Codex
app-server een ChatGPT-abonnementsaccount is. Niet-ChatGPT- of
ontbrekende accountresponsen slaan app-ondersteunde plugins over met
`codex_subscription_required`. Standaard roept migratie bron-`app/list` niet aan;
app-ondersteunde bronplugins die door de accountpoort komen, worden gepland
zonder verificatie van bronapptoegankelijkheid, en transportfouten bij accountopzoeking
worden overgeslagen met `codex_account_unavailable`. Met `--verify-plugin-apps`
maakt migratie een nieuwe bron-`app/list`-momentopname en vereist het dat elke app in eigendom
aanwezig, ingeschakeld en toegankelijk is voordat native activering wordt gepland. In
die modus vallen transportfouten bij accountopzoeking door naar de bron-
app-inventarispoort. Runtime-appinventaris is de toegankelijkheidscontrole voor de doelsessie
na migratie. De sessieconfiguratie van de Codex-harness berekent vervolgens een beperkende
thread-appconfiguratie voor de ingeschakelde en toegankelijke Plugin-apps.

Thread-appconfiguratie wordt berekend wanneer OpenClaw een Codex-harnesssessie
tot stand brengt of een verouderde Codex-threadbinding vervangt. Deze wordt niet bij elke beurt opnieuw berekend.

## V1-ondersteuningsgrens

V1 is bewust smal:

- Alleen `openai-curated` plugins die al waren geïnstalleerd in de bron-Codex
  app-serverinventaris komen in aanmerking voor migratie.
- App-ondersteunde bronplugins moeten door de abonnementspoort tijdens migratie komen.
  `--verify-plugin-apps` voegt de bron-app-inventarispoort toe. Accounts die door abonnementen worden afgeschermd
  plus, in verificatiemodus, ontoegankelijke, uitgeschakelde of ontbrekende bronapps
  of mislukte bron-app-inventarisverversingen worden gerapporteerd als overgeslagen handmatige
  items in plaats van ingeschakelde configvermeldingen. Onleesbare Plugin-details worden overgeslagen
  vóór de bron-app-inventarispoort.
- Migratie schrijft expliciete Plugin-identiteiten met `marketplaceName` en
  `pluginName`; het schrijft geen lokale `marketplacePath`-cachepaden.
- `codexPlugins.enabled` is de globale inschakelschakelaar.
- Er is geen `plugins["*"]`-wildcard en geen configsleutel die willekeurige
  installatiebevoegdheid verleent.
- Niet-ondersteunde marketplaces, gecachte Plugin-bundels, hooks en Codex-configbestanden
  blijven in het migratierapport behouden voor handmatige beoordeling.

## App-inventaris en eigenaarschap

OpenClaw leest de Codex-appinventaris via app-server `app/list`, cachet deze
één uur en ververst verouderde of ontbrekende vermeldingen asynchroon. De cache is
alleen in het geheugen; het herstarten van de CLI of Gateway verwijdert deze, en OpenClaw bouwt deze opnieuw op
vanaf de volgende `app/list`-lezing.

Migratie en runtime gebruiken afzonderlijke cachesleutels:

- Bronmigratieverificatie gebruikt de bron-Codex-home en bron-app-server
  startopties. Dit wordt alleen uitgevoerd wanneer `--verify-plugin-apps` is ingesteld, en het
  forceert een nieuwe bron-`app/list`-traversal voor die planningsrun.
- Doelruntimeconfiguratie gebruikt de Codex app-server-identiteit van de doelagent wanneer deze
  de Codex-thread-appconfiguratie bouwt. Plugin-activering maakt die doel-
  cachesleutel ongeldig en force-ververst deze daarna na `plugin/install`.

Een Plugin-app wordt alleen blootgesteld wanneer OpenClaw deze kan terugkoppelen naar de gemigreerde
Plugin via stabiel eigenaarschap:

- exacte app-id uit Plugin-detail
- bekende MCP-servernaam
- unieke stabiele metadata

Alleen weergavenaam of ambigu eigenaarschap wordt uitgesloten totdat de volgende inventaris-
verversing eigenaarschap bewijst.

## Thread-appconfiguratie

OpenClaw injecteert een beperkende `config.apps`-patch voor de Codex-thread:
`_default` is uitgeschakeld en alleen apps die eigendom zijn van ingeschakelde gemigreerde plugins zijn
ingeschakeld.

OpenClaw stelt appniveau-`destructive_enabled` in vanuit het effectieve globale of
per-Plugin `allow_destructive_actions`-beleid en laat Codex destructieve
toolmetadata afdwingen vanuit de native app-toolannotaties. De `_default`
appconfig is uitgeschakeld met `open_world_enabled: false`. Ingeschakelde Plugin-apps
worden uitgegeven met `open_world_enabled: true`; OpenClaw biedt geen afzonderlijke
Plugin open-world beleidsknop en onderhoudt geen per-Plugin deny lists voor destructieve
toolnamen.

Toolgoedkeuringsmodus is standaard automatisch voor Plugin-apps, zodat niet-destructieve
leestools kunnen worden uitgevoerd zonder goedkeurings-UI in dezelfde thread. Destructieve tools blijven
beheerst door het `destructive_enabled`-beleid van elke app.

## Beleid voor destructieve acties

Destructieve Plugin-elicitations zijn standaard toegestaan voor gemigreerde Codex-
plugins, terwijl onveilige schema's en ambigu eigenaarschap nog steeds gesloten falen:

- Globale `allow_destructive_actions` staat standaard op `true`.
- Per-Plugin `allow_destructive_actions` overschrijft het globale beleid voor die
  Plugin.
- Wanneer beleid `false` is, retourneert OpenClaw een deterministische weigering.
- Wanneer beleid `true` is, accepteert OpenClaw automatisch alleen veilige schema's die het kan koppelen aan
  een goedkeuringsrespons, zoals een boolean goedkeuringsveld.
- Ontbrekende Plugin-identiteit, ambigu eigenaarschap, een ontbrekende beurt-id, een verkeerde beurt-
  id of een onveilig elicitation-schema weigert in plaats van te vragen.

## Probleemoplossing

**`auth_required`:** migratie heeft de Plugin geïnstalleerd, maar een van de apps heeft nog steeds
authenticatie nodig. De expliciete Plugin-vermelding wordt uitgeschakeld geschreven totdat je
opnieuw autoriseert en deze inschakelt.

**`app_inaccessible`, `app_disabled`, of `app_missing`:**
migratie heeft de Plugin niet geïnstalleerd omdat de bron-Codex-appinventaris
niet alle apps in eigendom als aanwezig, ingeschakeld en toegankelijk liet zien terwijl
`--verify-plugin-apps` was ingesteld. Autoriseer opnieuw of schakel de app in Codex in en
voer migratie vervolgens opnieuw uit met `--verify-plugin-apps`.

**`app_inventory_unavailable`:** migratie heeft de Plugin niet geïnstalleerd omdat
strikte bronappverificatie was aangevraagd en het verversen van de bron-Codex-appinventaris
mislukte. Herstel toegang tot de bron-Codex app-server of probeer opnieuw zonder
`--verify-plugin-apps` als je het snellere account-gegate plan accepteert.

**`codex_subscription_required`:** migratie heeft de app-ondersteunde
Plugin niet geïnstalleerd omdat het bron-Codex app-serveraccount niet was ingelogd met een
ChatGPT-abonnementsaccount. Log in op de Codex-app met abonnementsauthenticatie,
en voer migratie vervolgens opnieuw uit.

**`codex_account_unavailable`:** migratie heeft de app-ondersteunde Plugin niet geïnstalleerd
omdat het bron-Codex app-serveraccount niet kon worden gelezen. Herstel bron-Codex
app-serverauthenticatie of voer opnieuw uit met `--verify-plugin-apps` als je wilt dat bronapp-
inventaris de geschiktheid bepaalt wanneer accountopzoeking mislukt.

**`marketplace_missing` of `plugin_missing`:** de doel-Codex app-server
kan de verwachte `openai-curated` marketplace of Plugin niet zien. Voer migratie opnieuw uit
tegen de doelruntime of inspecteer de Plugin-status van Codex app-server.

**`app_inventory_missing` of `app_inventory_stale`:** appgereedheid kwam uit een
lege of verouderde cache. OpenClaw plant een asynchrone verversing en sluit Plugin-
apps uit totdat eigenaarschap en gereedheid bekend zijn.

**`app_ownership_ambiguous`:** appinventaris kwam alleen overeen op weergavenaam, dus
de app wordt niet blootgesteld aan de Codex-thread.

**Config gewijzigd maar de agent kan de Plugin niet zien:** gebruik `/new`, `/reset`, of
herstart de Gateway. Bestaande Codex-threadbindingen behouden de appconfiguratie waarmee ze
zijn gestart totdat OpenClaw een nieuwe harnesssessie tot stand brengt of een
verouderde binding vervangt.

**Destructieve actie wordt geweigerd:** controleer de globale en per-Plugin
`allow_destructive_actions`-waarden. Zelfs wanneer beleid true is, falen onveilige elicitation-
schema's en ambigue Plugin-identiteit nog steeds gesloten.

## Gerelateerd

- [Codex-harness](/nl/plugins/codex-harness)
- [Codex-harnessreferentie](/nl/plugins/codex-harness-reference)
- [Codex-harnessruntime](/nl/plugins/codex-harness-runtime)
- [Configuratiereferentie](/nl/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrate CLI](/nl/cli/migrate)
