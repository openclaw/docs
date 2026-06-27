---
read_when:
    - Je wilt dat OpenClaw-agenten in Codex-modus native Codex-plugins gebruiken
    - U migreert vanuit de bron geïnstalleerde, door openai samengestelde Codex-plugins
    - Je lost problemen op met codexPlugins, app-inventaris, destructieve acties of Plugin-appdiagnostiek
summary: Gemigreerde native Codex-plugins configureren voor OpenClaw-agenten in Codex-modus
title: Native Codex-plugins
x-i18n:
    generated_at: "2026-06-27T17:52:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 82d8eb7ca7c10db5220c49426f5e9db5992ee751d48b2ac8c89e93773fc87776
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Native Codex Plugin-ondersteuning laat een OpenClaw-agent in Codex-modus de eigen app- en Plugin-mogelijkheden van Codex app-server gebruiken binnen dezelfde Codex-thread die de OpenClaw-beurt afhandelt.

OpenClaw vertaalt Codex Plugins niet naar synthetische `codex_plugin_*` dynamische OpenClaw-tools. Plugin-aanroepen blijven in het native Codex-transcript, en Codex app-server is eigenaar van de app-ondersteunde MCP-uitvoering.

Gebruik deze pagina nadat de basis-[Codex-harness](/nl/plugins/codex-harness) werkt.

## Vereisten

- De geselecteerde OpenClaw-agentruntime moet de native Codex-harness zijn.
- `plugins.entries.codex.enabled` moet true zijn.
- `plugins.entries.codex.config.codexPlugins.enabled` moet true zijn.
- V1 ondersteunt alleen `openai-curated` Plugins waarvan migratie heeft vastgesteld dat ze als broninstallatie aanwezig zijn in de bron-Codex-home.
- De doel-Codex app-server moet de verwachte marketplace-, Plugin- en app-inventaris kunnen zien.

`codexPlugins` heeft geen effect op OpenClaw-runs, normale OpenAI-provider-runs, ACP-gespreksbindingen of andere harnesses, omdat die paden geen Codex app-server-threads maken met native `apps`-configuratie.

Codex-toegang aan OpenAI-zijde, appbeschikbaarheid en werkruimtecontroles voor apps/Plugins komen van het aangemelde Codex-account. Zie voor het OpenAI-account- en beheermodel [Codex gebruiken met je ChatGPT-abonnement](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Snelstart

Bekijk een migratievoorbeeld vanuit de bron-Codex-home:

```bash
openclaw migrate codex --dry-run
```

Gebruik strikte bronappverificatie wanneer je wilt dat migratie de toegankelijkheid van bronapps controleert voordat native Plugin-activering wordt gepland:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Pas de migratie toe wanneer het plan er goed uitziet:

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

Na het wijzigen van `codexPlugins` nemen nieuwe Codex-gesprekken de bijgewerkte appset automatisch over. Gebruik `/new` of `/reset` om het huidige gesprek te vernieuwen. Een gateway-herstart is niet vereist voor wijzigingen om Plugins in of uit te schakelen.

## Plugins beheren vanuit chat

Gebruik `/codex plugins` wanneer je geconfigureerde native Codex Plugins wilt inspecteren of wijzigen vanuit dezelfde chat waarin je de Codex-harness bedient:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` is een alias voor `/codex plugins list`. De lijstuitvoer toont de geconfigureerde Plugin-sleutels, aan/uit-status, Codex Plugin-naam en marketplace uit `plugins.entries.codex.config.codexPlugins.plugins`.

`enable` en `disable` schrijven alleen naar de OpenClaw-configuratie op `~/.openclaw/openclaw.json`; ze bewerken `~/.codex/config.toml` niet en installeren geen nieuwe Codex Plugins. Alleen de eigenaar of een gateway-client met het `operator.admin`-bereik kan de Plugin-status wijzigen.

Het inschakelen van een geconfigureerde Plugin zet ook de globale `codexPlugins.enabled`-schakelaar aan. Als de Plugin uitgeschakeld is geschreven omdat migratie `auth_required` retourneerde, autoriseer de app dan opnieuw in Codex voordat je deze in OpenClaw inschakelt.

## Hoe native Plugin-installatie werkt

De integratie heeft drie afzonderlijke statussen:

- Geïnstalleerd: Codex heeft de lokale Plugin-bundel in de doel-app-serverruntime.
- Ingeschakeld: de OpenClaw-configuratie staat toe dat de Plugin beschikbaar wordt gemaakt voor Codex-harnessbeurten.
- Toegankelijk: Codex app-server bevestigt dat de appvermeldingen van de Plugin beschikbaar zijn voor het actieve account en kunnen worden gekoppeld aan de gemigreerde Plugin-identiteit.

Migratie is de duurzame stap voor installatie en geschiktheid. Tijdens de planning leest OpenClaw bron-Codex `plugin/read`-details en controleert of de accountrespons van de bron-Codex app-server een ChatGPT-abonnementsaccount is. Niet-ChatGPT- of ontbrekende accountresponsen slaan app-ondersteunde Plugins over met `codex_subscription_required`. Standaard roept migratie geen bron-`app/list` aan; app-ondersteunde bron-Plugins die de accountpoort passeren, worden gepland zonder verificatie van de toegankelijkheid van bronapps, en transportfouten bij accountopzoeking worden overgeslagen met `codex_account_unavailable`. Met `--verify-plugin-apps` neemt migratie een verse bron-`app/list`-snapshot en vereist dat elke beheerde app aanwezig, ingeschakeld en toegankelijk is voordat native activering wordt gepland. In die modus vallen transportfouten bij accountopzoeking door naar de poort voor bronappinventaris. Runtime-appinventaris is de toegankelijkheidscontrole voor de doelsessie na migratie. De sessie-instelling van de Codex-harness berekent vervolgens een beperkende thread-appconfiguratie voor de ingeschakelde en toegankelijke Plugin-apps.

Thread-appconfiguratie wordt berekend wanneer OpenClaw een Codex-harnesssessie tot stand brengt of een verouderde Codex-threadbinding vervangt. Dit wordt niet bij elke beurt opnieuw berekend, dus `/codex plugins enable` en `/codex plugins disable` beïnvloeden nieuwe Codex-gesprekken. Gebruik `/new` of `/reset` wanneer het huidige gesprek de bijgewerkte appset moet overnemen.

## V1-ondersteuningsgrens

V1 is bewust smal:

- Alleen `openai-curated` Plugins die al waren geïnstalleerd in de app-serverinventaris van de bron-Codex komen in aanmerking voor migratie.
- App-ondersteunde bron-Plugins moeten de abonnementspoort tijdens migratie passeren. `--verify-plugin-apps` voegt de poort voor bronappinventaris toe. Accounts die door een abonnementspoort worden beperkt plus, in verificatiemodus, ontoegankelijke, uitgeschakelde of ontbrekende bronapps of fouten bij het vernieuwen van bronappinventaris worden gerapporteerd als overgeslagen handmatige items in plaats van ingeschakelde configuratievermeldingen. Onleesbare Plugin-details worden overgeslagen vóór de poort voor bronappinventaris.
- Migratie schrijft expliciete Plugin-identiteiten met `marketplaceName` en `pluginName`; het schrijft geen lokale `marketplacePath`-cachepaden.
- `codexPlugins.enabled` is de globale inschakelingsschakelaar.
- Er is geen `plugins["*"]`-wildcard en geen configuratiesleutel die willekeurige installatiebevoegdheid verleent.
- Niet-ondersteunde marketplaces, gecachte Plugin-bundels, hooks en Codex-configuratiebestanden blijven behouden in het migratierapport voor handmatige beoordeling.

## Appinventaris en eigenaarschap

OpenClaw leest Codex-appinventaris via app-server `app/list`, cachet deze één uur en vernieuwt verouderde of ontbrekende vermeldingen asynchroon. De cache zit alleen in geheugen; het herstarten van de CLI of gateway verwijdert deze, en OpenClaw bouwt deze opnieuw op vanaf de volgende `app/list`-lezing.

Migratie en runtime gebruiken afzonderlijke cachesleutels:

- Bronmigratieverificatie gebruikt de bron-Codex-home en startopties van de bron-app-server. Dit draait alleen wanneer `--verify-plugin-apps` is ingesteld, en forceert een verse bron-`app/list`-traversal voor die planningsrun.
- Doelruntime-instelling gebruikt de Codex app-server-identiteit van de doelagent wanneer deze de Codex-thread-appconfiguratie bouwt. Plugin-activering maakt die doelcachesleutel ongeldig en force-vernieuwt deze vervolgens na `plugin/install`.

Een Plugin-app wordt alleen blootgesteld wanneer OpenClaw deze via stabiel eigenaarschap kan terugkoppelen aan de gemigreerde Plugin:

- exacte app-id uit Plugin-detail
- bekende MCP-servernaam
- unieke stabiele metadata

Alleen-weergavenaam of ambigu eigenaarschap wordt uitgesloten totdat de volgende inventarisvernieuwing het eigenaarschap bewijst.

## Thread-appconfiguratie

OpenClaw injecteert een beperkende `config.apps`-patch voor de Codex-thread: `_default` is uitgeschakeld en alleen apps die eigendom zijn van ingeschakelde gemigreerde Plugins worden ingeschakeld.

OpenClaw stelt app-niveau `destructive_enabled` in op basis van het effectieve globale of per-Plugin `allow_destructive_actions`-beleid en laat Codex destructieve toolmetadata afdwingen vanuit de native app-toolannotaties. `true`, `"auto"` en `"always"` stellen `destructive_enabled: true` in; `false` stelt het in op false. De `_default`-appconfiguratie is uitgeschakeld met `open_world_enabled: false`. Ingeschakelde Plugin-apps worden uitgegeven met `open_world_enabled: true`; OpenClaw biedt geen aparte beleidsknop voor open-world per Plugin en onderhoudt geen weigerlijsten met destructieve toolnamen per Plugin.

Toolgoedkeuringsmodus is standaard automatisch voor Plugin-apps, zodat niet-destructieve leestools kunnen draaien zonder goedkeurings-UI in dezelfde thread. Destructieve tools blijven beheerst door het `destructive_enabled`-beleid van elke app.

## Beleid voor destructieve acties

Destructieve Plugin-elicitations zijn standaard toegestaan voor gemigreerde Codex Plugins, terwijl onveilige schema’s en ambigu eigenaarschap nog steeds gesloten falen:

- Globale `allow_destructive_actions` is standaard `true`.
- Per-Plugin `allow_destructive_actions` overschrijft het globale beleid voor die Plugin.
- Wanneer het beleid `false` is, retourneert OpenClaw een deterministische weigering.
- Wanneer het beleid `true` is, accepteert OpenClaw alleen automatisch veilige schema’s die het kan koppelen aan een goedkeuringsrespons, zoals een booleaans goedkeuringsveld.
- Wanneer het beleid `"auto"` is, stelt OpenClaw destructieve Plugin-acties bloot aan Codex maar zet het MCP-goedkeurings-elicitations met bewezen eigenaarschap om in OpenClaw Plugin-goedkeuringen voordat de Codex-goedkeuringsrespons wordt geretourneerd.
- Wanneer het beleid `"always"` is, gebruikt OpenClaw dezelfde Codex-schrijf/destructieve gating als `"auto"`, wist het duurzame Codex-goedkeuringsoverschrijvingen per tool voor de app voordat de thread start, en biedt het alleen eenmalige goedkeuring of weigering zodat duurzame goedkeuringen latere prompts voor schrijfacties niet kunnen onderdrukken.
- Ontbrekende Plugin-identiteit, ambigu eigenaarschap, een ontbrekende beurt-id, een verkeerde beurt-id of een onveilig elicitation-schema weigert in plaats van om bevestiging te vragen.

## Probleemoplossing

**`auth_required`:** migratie heeft de Plugin geïnstalleerd, maar een van de apps moet nog worden geauthenticeerd. De expliciete Plugin-vermelding wordt uitgeschakeld geschreven totdat je opnieuw autoriseert en deze inschakelt.

**`app_inaccessible`, `app_disabled` of `app_missing`:**
migratie heeft de Plugin niet geïnstalleerd omdat de bron-Codex-appinventaris niet liet zien dat alle beheerde apps aanwezig, ingeschakeld en toegankelijk waren terwijl `--verify-plugin-apps` was ingesteld. Autoriseer of schakel de app opnieuw in Codex in, en voer migratie daarna opnieuw uit met `--verify-plugin-apps`.

**`app_inventory_unavailable`:** migratie heeft de Plugin niet geïnstalleerd omdat strikte bronappverificatie was aangevraagd en het vernieuwen van de bron-Codex-appinventaris mislukte. Herstel toegang tot de bron-Codex app-server of probeer opnieuw zonder `--verify-plugin-apps` als je het snellere account-gegate plan accepteert.

**`codex_subscription_required`:** migratie heeft de app-ondersteunde Plugin niet geïnstalleerd omdat het bron-Codex app-server-account niet was aangemeld met een ChatGPT-abonnementsaccount. Meld je aan bij de Codex-app met abonnementsauthenticatie en voer migratie daarna opnieuw uit.

**`codex_account_unavailable`:** migratie heeft de app-ondersteunde Plugin niet geïnstalleerd omdat het bron-Codex app-server-account niet kon worden gelezen. Herstel de authenticatie van de bron-Codex app-server of voer opnieuw uit met `--verify-plugin-apps` als je wilt dat bronappinventaris de geschiktheid bepaalt wanneer accountopzoeking mislukt.

**`marketplace_missing` of `plugin_missing`:** de doel-Codex app-server kan de verwachte `openai-curated`-marketplace of Plugin niet zien. Voer migratie opnieuw uit tegen de doelruntime of inspecteer de Plugin-status van Codex app-server.

**`app_inventory_missing` of `app_inventory_stale`:** appgereedheid kwam uit een lege of verouderde cache. OpenClaw plant een asynchrone vernieuwing en sluit Plugin-apps uit totdat eigenaarschap en gereedheid bekend zijn.

**`app_ownership_ambiguous`:** appinventaris kwam alleen overeen op weergavenaam, dus de app wordt niet blootgesteld aan de Codex-thread.

**Configuratie gewijzigd maar de agent kan de Plugin niet zien:** gebruik `/codex plugins list` om de geconfigureerde status te bevestigen, en gebruik daarna `/new` of `/reset`. Bestaande Codex-threadbindingen behouden de appconfiguratie waarmee ze zijn gestart totdat OpenClaw een nieuwe harnesssessie tot stand brengt of een verouderde binding vervangt.

**Destructieve actie is geweigerd:** controleer de globale en per-Plugin
`allow_destructive_actions`-waarden. Zelfs wanneer het beleid true, `"auto"` of
`"always"` is, worden onveilige elicitatieschema's en een dubbelzinnige Plugin-identiteit nog steeds standaard geweigerd.

## Gerelateerd

- [Codex-harnas](/nl/plugins/codex-harness)
- [Codex-harnasreferentie](/nl/plugins/codex-harness-reference)
- [Codex-harnasruntime](/nl/plugins/codex-harness-runtime)
- [Configuratiereferentie](/nl/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI migreren](/nl/cli/migrate)
