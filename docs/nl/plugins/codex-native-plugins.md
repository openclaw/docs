---
read_when:
    - Je wilt dat OpenClaw-agents in Codex-modus native Codex-plugins gebruiken
    - U migreert vanuit broncode geïnstalleerde, door OpenAI samengestelde Codex-plugins
    - Je configureert een bestaande Codex-plugin in een werkruimtemap
    - Je probeert problemen op te lossen met codexPlugins, de app-inventaris, destructieve acties of diagnostiek voor Plugin-apps
summary: Configureer native Codex-plugins voor OpenClaw-agenten in Codex-modus
title: Native Codex-plugins
x-i18n:
    generated_at: "2026-07-12T09:07:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b1cfa39838d4dbd1f33a1e5b7f52faec4b033f9fa98ef5c029003177c2e27e5
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Natieve ondersteuning voor Codex-plugins laat een OpenClaw-agent in Codex-modus de eigen app- en pluginmogelijkheden van Codex app-server gebruiken binnen dezelfde Codex-thread die de OpenClaw-beurt afhandelt. Plugin-aanroepen blijven in het native Codex-transcript; Codex app-server beheert de app-ondersteunde MCP-uitvoering. OpenClaw vertaalt Codex-plugins niet naar synthetische dynamische OpenClaw-tools met de naam `codex_plugin_*`.

Gebruik deze pagina nadat de basis-[Codex-harnas](/nl/plugins/codex-harness) werkt.

## Vereisten

- De agentruntime moet het native Codex-harnas zijn.
- `plugins.entries.codex.enabled` is `true`.
- `plugins.entries.codex.config.codexPlugins.enabled` is `true`.
- De beoogde Codex app-server kan de verwachte marketplace-, plugin- en app-inventaris zien.
- Migratie ondersteunt alleen `openai-curated`-plugins die als vanuit de bron geïnstalleerd zijn waargenomen in de oorspronkelijke Codex-home.
- Handmatig geconfigureerde `workspace-directory`-plugins vereisen een Codex app-server waarvan `plugin/list` `marketplaceKinds` accepteert en waarvan padloze werkruimteoverzichten `remotePluginId` bevatten. De plugin moet al geïnstalleerd en ingeschakeld zijn en de bijbehorende apps moeten toegankelijk zijn in `app/list`.

`codexPlugins` heeft geen effect op uitvoeringen via de OpenClaw-provider, ACP-gesprekskoppelingen of andere harnassen, omdat die paden nooit Codex app-server-threads met native `apps`-configuratie maken.

Het Codex-account, de appbeschikbaarheid en de besturing van werkruimte-apps en -plugins aan OpenAI-zijde zijn afkomstig van het aangemelde Codex-account. Zie [Codex gebruiken met je ChatGPT-abonnement](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan) voor het account- en beheermodel van OpenAI.

## Snel aan de slag

Bekijk een voorbeeld van de migratie vanuit de oorspronkelijke Codex-home:

```bash
openclaw migrate codex --dry-run
```

Voeg `--verify-plugin-apps` toe om tijdens de migratie `app/list` op de bron aan te roepen en te vereisen dat elke bijbehorende app aanwezig, ingeschakeld en toegankelijk is voordat native activering wordt gepland:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Pas de migratie toe wanneer het plan er correct uitziet:

```bash
openclaw migrate apply codex --yes
```

De migratie schrijft expliciete `codexPlugins`-vermeldingen voor geschikte plugins en roept `plugin/install` van Codex app-server aan voor geselecteerde plugins. Een gemigreerde configuratie ziet er als volgt uit:

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

Migratie blijft beperkt tot `openai-curated`. Als je een bestaande `workspace-directory`-plugin wilt gebruiken, voeg je deze handmatig toe met de exacte door de marketplace gekwalificeerde `summary.id` die door `plugin/list` wordt geretourneerd. Als Codex bijvoorbeeld `example-plugin@workspace-directory` retourneert, configureer je die volledige waarde in plaats van de weergavenaam:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            plugins: {
              "example-plugin": {
                enabled: true,
                marketplaceName: "workspace-directory",
                pluginName: "example-plugin@workspace-directory",
              },
            },
          },
        },
      },
    },
  },
}
```

OpenClaw roept `plugin/install` niet aan en start geen authenticatie voor een `workspace-directory`-plugin. Installeer, activeer en authenticeer deze in Codex voordat je het OpenClaw-beleid toevoegt of inschakelt. OpenClaw houdt apps verborgen wanneer het antwoord niet de exacte marketplace, plugin-ID, detail-ID of bewijs van appgereedheid bevat. Als Codex het expliciete `plugin/list`-verzoek voor de werkruimte afwijst, meldt OpenClaw `marketplace_missing` voor elke ingeschakelde werkruimteplugin en blijven onafhankelijk gevonden beheerde plugins beschikbaar.

Na een wijziging aan `codexPlugins` nemen nieuwe Codex-gesprekken de bijgewerkte appset automatisch over. Voer `/new` of `/reset` uit om het huidige gesprek te vernieuwen. Een herstart van de Gateway is niet vereist voor wijzigingen waarmee plugins worden in- of uitgeschakeld.

## Plugins beheren vanuit de chat

`/codex plugins` inspecteert of wijzigt geconfigureerde native Codex-plugins vanuit dezelfde chat waarin je het Codex-harnas bedient:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` is een alias voor `/codex plugins list`. De lijst toont voor elke geconfigureerde plugin de sleutel, de aan/uit-status, de Codex-pluginnaam en de marketplace uit `plugins.entries.codex.config.codexPlugins.plugins`.

`enable`/`disable` schrijven alleen naar `~/.openclaw/openclaw.json`; ze bewerken nooit `~/.codex/config.toml` en installeren geen nieuwe Codex-plugins. Alleen de eigenaar of een Gateway-client met het bereik `operator.admin` kan deze opdrachten uitvoeren.

Als je een geconfigureerde plugin inschakelt, wordt ook de algemene schakelaar `codexPlugins.enabled` ingeschakeld. Als een beheerde plugin uitgeschakeld is geschreven omdat de migratie `auth_required` retourneerde, moet je de app opnieuw autoriseren in Codex voordat je deze in OpenClaw inschakelt. Voor een `workspace-directory`-vermelding wijzigt het inschakelen ervan hier alleen het OpenClaw-beleid; de plugin en app moeten al actief zijn in Codex.

## Hoe native pluginconfiguratie werkt

De integratie houdt drie statussen bij:

| Status      | Betekenis                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Geïnstalleerd | Codex heeft de pluginbundel in de runtime van de beoogde app-server.                                                                |
| Ingeschakeld  | Codex meldt dat de plugin is ingeschakeld en de OpenClaw-configuratie staat deze toe voor beurten via het Codex-harnas.              |
| Toegankelijk  | Codex app-server bevestigt dat de appvermeldingen van de plugin beschikbaar zijn voor het actieve account en overeenkomen met de geconfigureerde pluginidentiteit. |

Voor `openai-curated`-plugins is migratie de duurzame installatie- en geschiktheidsstap:

- Tijdens het plannen leest OpenClaw de details uit `plugin/read` van de oorspronkelijke Codex en controleert het of het account van de oorspronkelijke Codex app-server een ChatGPT-abonnementsaccount is. Bij een antwoord met een niet-ChatGPT-account of zonder account worden app-ondersteunde plugins overgeslagen met `codex_subscription_required`.
- Standaard slaat de migratie de aanroep van `app/list` op de bron over: app-ondersteunde bronplugins die de accountcontrole doorstaan, worden gepland zonder verificatie van de toegankelijkheid van de bronapp, en transportfouten bij het opzoeken van het account leiden tot overslaan met `codex_account_unavailable`.
- Met `--verify-plugin-apps` maakt de migratie een nieuwe momentopname van `app/list` op de bron en vereist deze dat elke bijbehorende app aanwezig, ingeschakeld en toegankelijk is voordat native activering wordt gepland. Transportfouten bij het opzoeken van het account gaan dan door naar de controle van de bronappinventaris in plaats van direct tot overslaan te leiden.

Voor `workspace-directory`-plugins vindt de configuratie buiten OpenClaw plaats. OpenClaw bevraagt die marketplace alleen wanneer ten minste één ingeschakelde werkruimtevermelding is geconfigureerd, zoekt elke plugin op via de exacte `summary.id` en hergebruikt de bestaande controles voor eigendom via `plugin/read` en gereedheid via `app/list`. Een niet-geïnstalleerde, uitgeschakelde, ontoegankelijke of niet-geauthenticeerde plugin stelt geen apps beschikbaar; OpenClaw probeert geen installatie of authenticatie uit te voeren.

De appinventaris tijdens runtime vormt voor zowel gemigreerde beheerde plugins als handmatig geconfigureerde werkruimteplugins de toegankelijkheidscontrole van de doelsessie. Tijdens het instellen van de Codex-harnassessie wordt een beperkende appconfiguratie voor de thread berekend op basis van de ingeschakelde en toegankelijke plugin-apps; deze wordt niet bij elke beurt opnieuw berekend. Daarom hebben `/codex plugins enable`/`disable` alleen invloed op nieuwe Codex-gesprekken. Gebruik `/new` of `/reset` om de wijziging in het huidige gesprek over te nemen.

## Ondersteuningsgrens van V1

- Alleen `openai-curated`-plugins die al in de app-serverinventaris van de oorspronkelijke Codex zijn geïnstalleerd, komen in aanmerking voor migratie.
- De runtime ondersteunt ook expliciete `workspace-directory`-vermeldingen op app-serverbuilds waarvan `plugin/list` `marketplaceKinds` implementeert en `remotePluginId` retourneert voor padloze werkruimteoverzichten. Deze vermeldingen moeten hun exacte door de marketplace gekwalificeerde `summary.id` gebruiken en moeten al geïnstalleerd, ingeschakeld en via de app toegankelijk zijn. Een afgewezen verzoek om de werkruimtelijst levert de bestaande diagnose `marketplace_missing` per plugin op; bij ontbrekend bewijs voor de marketplace, plugin, details of app wordt geen werkruimte-app beschikbaar gesteld. Beheerde inventaris uit het standaardlijstverzoek blijft bruikbaar.
- App-ondersteunde bronplugins moeten de abonnementscontrole tijdens de migratie doorstaan. `--verify-plugin-apps` voegt de controle van de bronappinventaris toe. Accounts die door de abonnementscontrole worden geblokkeerd en, in verificatiemodus, ontoegankelijke, uitgeschakelde of ontbrekende bronapps of fouten bij het vernieuwen van de appinventaris, worden gerapporteerd als overgeslagen handmatige items in plaats van ingeschakelde configuratievermeldingen. Onleesbare plugindetails worden vóór de controle van de appinventaris overgeslagen.
- Migratie schrijft expliciete pluginidentiteiten (`marketplaceName` en `pluginName`); er worden geen lokale cachepaden van `marketplacePath` geschreven.
- `codexPlugins.enabled` is de enige algemene inschakelschakelaar; er is geen jokerteken `plugins["*"]` of configuratiesleutel die willekeurige installatiebevoegdheid verleent.
- Niet-beheerde marketplaces, gecachete pluginbundels, hooks en Codex-configuratiebestanden worden in het migratierapport behouden voor handmatige beoordeling en niet automatisch geactiveerd. De runtime accepteert handmatig geconfigureerde `workspace-directory`-vermeldingen; andere marketplaces blijven niet ondersteund.

## Appinventaris en eigendom

OpenClaw leest de Codex-appinventaris via `app/list` van app-server, bewaart deze één uur in het geheugen en vernieuwt verouderde of ontbrekende vermeldingen asynchroon. De cache is lokaal voor het proces; als je de CLI of Gateway opnieuw start, wordt deze verwijderd en bouwt OpenClaw de cache opnieuw op bij de volgende uitlezing van `app/list`.

Migratie en runtime gebruiken afzonderlijke cachesleutels:

- Verificatie van de bronmigratie gebruikt de oorspronkelijke Codex-home en startopties. Deze wordt alleen uitgevoerd met `--verify-plugin-apps` en dwingt een nieuwe doorloop van `app/list` op de bron af voor die planningsuitvoering.
- De runtimeconfiguratie van het doel gebruikt de Codex app-server-identiteit van de doelagent bij het opbouwen van de appconfiguratie voor de thread. Activering van een beheerde plugin maakt die doelcachesleutel ongeldig en vernieuwt deze vervolgens geforceerd na `plugin/install`. De configuratie van `workspace-directory` doorloopt dit activeringspad nooit.

Een plugin-app wordt alleen beschikbaar gesteld wanneer OpenClaw deze via stabiel eigendom aan de geconfigureerde plugin kan koppelen: een exacte app-ID uit de plugindetails, een bekende MCP-servernaam of unieke stabiele metagegevens. Eigendom dat alleen op de weergavenaam is gebaseerd of dubbelzinnig is, wordt uitgesloten totdat bij de volgende inventarisvernieuwing het eigendom wordt bewezen.

## Apps van gekoppelde accounts

Door de eigenaar beheerde agents kunnen ervoor kiezen alle apps toe te staan die al met hun Codex-account zijn verbonden, zonder dat een overeenkomend pluginpakket vereist is:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_all_plugins: true,
            allow_destructive_actions: "auto",
          },
        },
      },
    },
  },
}
```

`allow_all_plugins: true` maakt een volledige momentopname van `app/list` wanneer een nieuwe native Codex-thread tot stand wordt gebracht en laat alleen apps toe die als toegankelijk voor dat account zijn gemarkeerd. Het installeert, authenticeert of activeert apps niet algemeen. Bestaande threads behouden hun opgeslagen appset; gebruik `/new`, `/reset` of start de Gateway opnieuw om nieuw gekoppelde of ingetrokken apps over te nemen.

Accountapps nemen de algemene waarde `codexPlugins.allow_destructive_actions` over, die `true`, `false`, `"auto"` of `"ask"` accepteert. Expliciet beleid per plugin overschrijft het algemene beleid voor overlappende app-ID's. Bij inventarisfouten wordt standaard alles geblokkeerd in plaats van teruggevallen op een onbeperkte standaardinstelling.

## Appconfiguratie voor threads

OpenClaw injecteert een beperkende `config.apps`-patch voor de Codex-thread:
`_default` is uitgeschakeld en alleen apps die eigendom zijn van ingeschakelde geconfigureerde plugins of
toegankelijke account-apps die door `allow_all_plugins` zijn toegelaten, zijn ingeschakeld.

`destructive_enabled` voor elke app is afkomstig van het effectieve globale of
per-pluginbeleid `allow_destructive_actions`; `true`, `"auto"` en `"ask"`
stellen allemaal `destructive_enabled: true` in, en `false` stelt dit in op `false`. Codex
handhaaft nog steeds metagegevens voor destructieve tools uit de eigen annotaties van de app-tools.
`_default` is uitgeschakeld met `open_world_enabled: false`; ingeschakelde plugin-apps
krijgen `open_world_enabled: true`. OpenClaw biedt geen afzonderlijke
beleidsinstelling op pluginniveau voor open-world en onderhoudt geen
per-pluginblokkeerlijsten met namen van destructieve tools.

De modus voor toolgoedkeuring is standaard automatisch voor toegelaten apps, zodat niet-destructieve
leestools worden uitgevoerd zonder goedkeuringsprompt binnen dezelfde thread. Destructieve tools blijven
onder het beheer van het `destructive_enabled`-beleid van elke app.

## Beleid voor destructieve acties

Destructieve pluginverzoeken zijn standaard toegestaan voor geconfigureerde Codex-
plugins, terwijl onveilige schema's en ambigu eigenaarschap gesloten worden geweigerd:

- Globaal is `allow_destructive_actions` standaard `true`.
- `allow_destructive_actions` per plugin overschrijft het globale beleid voor
  die plugin.
- `false`: OpenClaw retourneert een deterministische weigering.
- `true`: OpenClaw accepteert automatisch alleen veilige schema's die het naar een goedkeurings-
  antwoord kan omzetten, zoals een booleaans goedkeuringsveld.
- `"auto"`: OpenClaw stelt destructieve pluginacties beschikbaar aan Codex en
  zet vervolgens MCP-goedkeuringsverzoeken waarvan het eigenaarschap is bewezen om in OpenClaw-plugin-
  goedkeuringen voordat het Codex-goedkeuringsantwoord wordt geretourneerd.
- `"ask"`: OpenClaw gebruikt dezelfde Codex-beperking voor schrijf- en destructieve acties als
  `"auto"`, wist vóór het starten van de thread duurzame Codex-goedkeuringsoverschrijvingen per tool voor de app
  en biedt alleen eenmalige goedkeuring of weigering, zodat
  duurzame goedkeuringen latere prompts voor schrijfacties niet kunnen onderdrukken. Voor elke
  toegelaten app die `"ask"` gebruikt, selecteert OpenClaw de menselijke goedkeurings-
  beoordelaar van Codex voor die app, zodat Codex zijn goedkeuringsverzoeken naar
  OpenClaw verzendt; andere apps en niet-appgebonden threadgoedkeuringen behouden hun geconfigureerde
  beoordelaar en beleid.
- Ontbrekende pluginidentiteit, ambigu eigenaarschap, een ontbrekend of niet-overeenkomend
  beurt-id of een onveilig verzoeksschema leidt tot weigering in plaats van een prompt.

## Probleemoplossing

| Code                                              | Betekenis                                                                                                                              | Oplossing                                                                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `auth_required`                                   | De migratie heeft de plugin geïnstalleerd, maar een van de apps vereist nog authenticatie. De vermelding wordt uitgeschakeld opgeslagen totdat u opnieuw autoriseert. | Autoriseer de app opnieuw in Codex en schakel vervolgens de plugin in OpenClaw in.                                                      |
| `app_inaccessible`, `app_disabled`, `app_missing` | Met `--verify-plugin-apps` bevatte de broninventaris van Codex-apps niet alle apps van de eigenaar als aanwezig, ingeschakeld en toegankelijk.         | Autoriseer de app opnieuw of schakel deze in Codex in en voer de migratie vervolgens opnieuw uit met `--verify-plugin-apps`.                              |
| `app_inventory_unavailable`                       | Er is strikte verificatie van bron-apps aangevraagd, maar het vernieuwen van de broninventaris van Codex-apps is mislukt.                                      | Herstel de toegang tot de app-server van de bron-Codex of probeer het opnieuw zonder `--verify-plugin-apps` om het snellere, door het account beperkte plan te accepteren.   |
| `codex_subscription_required`                     | Het account van de app-server van de bron-Codex was geen ChatGPT-abonnementsaccount.                                                          | Meld u met abonnementsauthenticatie aan bij de Codex-app en voer de migratie vervolgens opnieuw uit.                                                  |
| `codex_account_unavailable`                       | Het account van de app-server van de bron-Codex kon niet worden gelezen.                                                                               | Herstel de authenticatie van de app-server van de bron-Codex of voer de migratie opnieuw uit met `--verify-plugin-apps`, zodat de broninventaris van apps de geschiktheid bepaalt. |
| `marketplace_missing`, `plugin_missing`           | Marketplace of exacte plugin niet beschikbaar; het expliciete verzoek voor de werkruimtecatalogus is mogelijk geweigerd; werkruimte-apps worden gesloten geweigerd.  | Controleer het compatibele app-servercontract en de hieronder beschreven exacte ID.                                                |
| `plugin_detail_unavailable`                       | OpenClaw kon de eigendomsgegevens van de plugin niet lezen.                                                                                    | Controleer de antwoorden `plugin/list` en `plugin/read` van de doel-app-server.                                             |
| `plugin_disabled`                                 | Codex meldt dat de plugin is geïnstalleerd maar uitgeschakeld.                                                                                     | Gecureerde activering kan dit herstellen; schakel vóór een nieuwe poging een werkruimteplugin in Codex in.                                  |
| `plugin_activation_failed`                        | De activering van de plugin is niet voltooid.                                                                                                  | Gebruik de bijgevoegde diagnose om onderscheid te maken tussen fouten met de marketplace, authenticatie, vernieuwing of gereedheid van de werkruimte.                |
| `app_inventory_missing`, `app_inventory_stale`    | De gereedheidsstatus van de app kwam uit een lege of verouderde cache.                                                                                     | OpenClaw plant automatisch een asynchrone vernieuwing; plugin-apps blijven uitgesloten totdat eigenaarschap en gereedheid bekend zijn.  |
| `app_ownership_ambiguous`                         | De app-inventaris kwam alleen overeen op basis van de weergavenaam.                                                                                          | De app blijft verborgen voor de Codex-thread totdat een latere vernieuwing het eigenaarschap bewijst.                                     |

**Werkruimteplugin is geïnstalleerd maar niet zichtbaar:** controleer of het resultaat van
`plugin/list` voor de werkruimte de exact geconfigureerde ID als geïnstalleerd en ingeschakeld rapporteert,
en controleer vervolgens of `app/list` elke app van de eigenaar als toegankelijk rapporteert voor hetzelfde Codex-
account. OpenClaw kan een toegankelijke app voor de thread inschakelen, zelfs wanneer de
accountinventaris die app momenteel als uitgeschakeld rapporteert. Als u die status hebt gewijzigd nadat de Gateway de app-
inventaris in de cache had opgeslagen, wacht dan op de cachevernieuwing na één uur of start de Gateway opnieuw en gebruik vervolgens
`/new` of `/reset`. OpenClaw herstelt of authenticeert geen werkruimteplugins.
Als het expliciete werkruimtelijstverzoek wordt geweigerd, rapporteert elke ingeschakelde werkruimte-
vermelding `marketplace_missing`; niet-gerelateerde gecureerde vermeldingen gaan nog steeds door
op basis van het antwoord van de standaardlijst.

Voor `plugin_detail_unavailable` moet een padloze werkruimtesamenvatting
`remotePluginId` bevatten; OpenClaw houdt apps van de eigenaar verborgen wanneer die selector of het
daaropvolgende resultaat van `plugin/read` niet beschikbaar is. Voor
`plugin_activation_failed` kunnen gecureerde plugins een fout met de marketplace, authenticatie of
vernieuwing na installatie rapporteren. Een werkruimteplugin rapporteert deze code wanneer deze
nog niet actief is; installeer, schakel in en authenticeer deze buiten OpenClaw.

**Configuratie gewijzigd, maar de agent kan de plugin niet zien:** voer `/codex plugins
list` uit om de geconfigureerde status te controleren en gebruik vervolgens `/new` of `/reset`. Bestaande
Codex-threadkoppelingen behouden de app-configuratie waarmee ze zijn gestart totdat OpenClaw
een nieuwe harness-sessie opzet of een verouderde koppeling vervangt.

**Destructieve actie wordt geweigerd:** controleer de globale en per-pluginwaarden van
`allow_destructive_actions`. Zelfs met `true`, `"auto"` of `"ask"` worden
onveilige verzoeksschema's en ambigue pluginidentiteit nog steeds gesloten geweigerd.

## Gerelateerd

- [Codex-harness](/nl/plugins/codex-harness)
- [Codex-harnessreferentie](/nl/plugins/codex-harness-reference)
- [Codex-harnessruntime](/nl/plugins/codex-harness-runtime)
- [Configuratiereferentie](/nl/gateway/configuration-reference#codex-harness-plugin-config)
- [Migratie-CLI](/nl/cli/migrate)
