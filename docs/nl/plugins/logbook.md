---
read_when:
    - Je wilt een tijdlijn van je dag in Dayflow-stijl in de Control UI
    - U schakelt de meegeleverde Logbook-plugin in of configureert deze
    - Je wilt stand-upsamenvattingen of een dagoverzicht op basis van schermactiviteit
summary: Optioneel automatisch werkjournaal opgebouwd uit periodieke schermafbeeldingen
title: Logboekplugin
x-i18n:
    generated_at: "2026-07-12T09:04:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3ea1d40d62041417d047fbaf6b02aeb86e76314b8f620f7b9939e2e0c3b9f7e
    source_path: plugins/logbook.md
    workflow: 16
---

De Logbook-plugin zet schermactiviteit om in een automatisch werklogboek. Het
maakt periodiek schermopnamen van een gekoppelde Node, vat deze samen in
waarnemingen met tijdstempels en bouwt tijdlijnkaarten in de
[Control UI](/nl/web/control-ui). Het kan ook dagelijkse stand-upnotities genereren en
vragen over een bijgehouden dag beantwoorden.

Door OpenClaw beheerde status blijft op de Gateway onder `<state-dir>/logbook/`, maar
modelverwerking vindt niet noodzakelijk lokaal plaats. Bemonsterde schermafbeeldingen gaan naar de
geconfigureerde visuele route; waarnemingen en tijdlijntekst gaan naar het standaard
agentmodel. Gebruik lokale modelroutes voor beide fasen als scherminhoud en
afgeleide activiteitstekst op de machine moeten blijven.

Logbook wordt meegeleverd en is standaard uitgeschakeld. Als u de plugin inschakelt, stemt u ermee in
dat de Gateway schermopnamen maakt, omdat `captureEnabled` standaard `true` is.

## Voordat u begint

U hebt het volgende nodig:

- Een verbonden Node die `screen.snapshot` of `logbook.snapshot` aanbiedt. De
  macOS-app-Node heeft toestemming voor schermopname nodig. Een headless macOS-Node-host
  (`openclaw node host run`) krijgt de door de plugin geleverde opdracht `logbook.snapshot`,
  die gebruikmaakt van het systeemhulpmiddel `screencapture`.
- De meegeleverde Codex-plugin, ingeschakeld en geauthenticeerd. Codex biedt momenteel
  het contract voor gestructureerde afbeeldingsextractie dat Logbook vereist. Meld u aan met
  `openclaw models auth login --provider openai`; zie
  [Codex-harnas](/nl/plugins/codex-harness) voor andere authenticatieroutes.
- Een werkend standaard agentmodel. Logbook gebruikt dit na de visuele verwerking om kaarten,
  stand-upnotities en vragen en antwoorden over de dag te genereren.

## Snelstart

Schakel de Codex- en Logbook-plugins in:

```bash
openclaw plugins enable codex
openclaw plugins enable logbook
```

Configureer een expliciet visueel model voor deterministisch opstarten:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
      logbook: {
        enabled: true,
        config: {
          visionModel: "codex/gpt-5.6-sol",
        },
      },
    },
  },
}
```

Als u `plugins.allow` gebruikt, neemt u zowel `codex` als `logbook` op. Start de
Gateway opnieuw nadat u de pluginconfiguratie hebt gewijzigd, inspecteer vervolgens de registraties
en open het dashboard:

```bash
openclaw gateway restart
openclaw plugins inspect logbook --runtime --json
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw dashboard
```

De Node-beschrijving moet `screen.snapshot` of `logbook.snapshot` bevatten.
Headless Nodes bieden `logbook.snapshot` pas aan nadat de plugin actief is.
Zie [Problemen met Nodes oplossen](/nl/nodes/troubleshooting) als de opdracht ontbreekt.

Het tabblad Logbook verschijnt alleen bij een ingeschakelde plugin en een Control UI-sessie met
`operator.write`. De statusrij moet zonder foutmelding **Vastleggen** tonen.
Er verschijnt een tijdlijnkaart wanneer het analysevenster sluit, of u kunt
**Nu analyseren** selecteren nadat activiteit is vastgelegd.

## Hoe het werkt

1. **Vastleggen**: elke `captureIntervalSeconds` (standaard 30 s) roept Logbook
   de vastlegopdracht van de geselecteerde Node aan en slaat het een geschaald JPEG-frame op.
   Opeenvolgende identieke frames worden als inactief gemarkeerd en van analyse uitgesloten.
2. **Waarnemen**: zodra een analysevenster (standaard 15 minuten) is verstreken, bemonstert de
   plugin maximaal 16 actieve frames en stuurt deze naar het visuele model,
   dat activiteitswaarnemingen met tijdstempels retourneert ("VS Code: store.ts bewerken,
   een typefout herstellen"). Een vastlegonderbreking van meer dan twee minuten of
   lokale middernacht sluit ook het huidige venster.
3. **Samenstellen**: waarnemingen plus de laatste 45 minuten aan bestaande kaarten worden
   herzien tot tijdlijnkaarten (elk 10-60 minuten) met een titel, samenvatting,
   categorie, hoofdapp en eventuele korte afleidingen.
4. **Opschonen**: frames ouder dan `retentionDays` (standaard 14) worden verwijderd.
   Kaarten, waarnemingen en gecachte stand-ups blijven behouden.

Daggrenzen en tijdlijnklokken gebruiken de lokale tijdzone van de Gateway, niet de
tijdzone van de browser. Frames en de SQLite-tijdlijndatabase staan onder
`<state-dir>/logbook/`.

## Model- en gegevensstroom

Logbook gebruikt twee afzonderlijke modelroutes:

| Fase              | Verzonden gegevens                                          | Modelroute                                                        |
| ----------------- | ----------------------------------------------------------- | ----------------------------------------------------------------- |
| Waarnemen         | Maximaal 16 bemonsterde JPEG-frames plus hun vastlegtijden  | `visionModel`, of een compatibele geleende Codex-vermelding voor `tools.media` |
| Kaarten samenstellen | Waarnemingen met tijdstempels en recente tijdlijnkaarten | Standaard agentmodel via de LLM-runtime van de plugin             |
| Stand-up genereren | Kaarten voor de geselecteerde en vorige dag                | Standaard agentmodel via de LLM-runtime van de plugin             |
| Vragen over uw dag | De vraag, kaarten van de geselecteerde dag en recente waarnemingen | Standaard agentmodel via de LLM-runtime van de plugin        |

De volledige SQLite-database wordt niet naar een van beide modellen verzonden. Onbewerkte schermafbeeldingen gaan alleen
naar de waarnemingsfase; het samenstellen van kaarten, stand-up en vragen en antwoorden ontvangen afgeleide
tekst.

## Configuratie

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
      logbook: {
        enabled: true,
        config: {
          captureEnabled: true,
          captureIntervalSeconds: 30,
          analysisIntervalMinutes: 15,
          nodeId: "my-mac",
          screenIndex: 0,
          maxWidth: 1440,
          visionModel: "codex/gpt-5.6-sol",
          retentionDays: 14,
        },
      },
    },
  },
}
```

Alle Logbook-configuratiesleutels zijn optioneel. Numerieke waarden worden afgerond op gehele getallen
en begrensd tot het ondersteunde bereik.

| Sleutel                   | Standaard | Bereik of waarden        | Gedrag                                                                                       |
| ------------------------- | --------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| `captureEnabled`          | `true`    | booleaans                | Permanente hoofdschakelaar voor nieuwe opnamen; de tijdlijn blijft beschikbaar bij `false`   |
| `captureIntervalSeconds`  | `30`      | `5`-`600`                | Vertraging tussen vastlegpogingen                                                            |
| `analysisIntervalMinutes` | `15`      | `3`-`120`                | Beoogd waarnemingsvenster; onderbrekingen en middernacht kunnen het eerder sluiten            |
| `nodeId`                  | niet ingesteld | Node-id of weergavenaam | Zet vastleggen vast op één verbonden Node; vergelijking is niet hoofdlettergevoelig       |
| `screenIndex`             | `0`       | `0`-`16`                 | Op nul gebaseerde schermindex                                                                |
| `maxWidth`                | `1440`    | `480`-`3840`             | Gevraagde maximale opnamegrootte; headless macOS past deze toe op de grootste dimensie        |
| `visionModel`             | niet ingesteld | `provider/model`    | Expliciete gestructureerde route; ongeldige verwijzingen pauzeren analyse, niet-ondersteunde providers laten batches mislukken |
| `retentionDays`           | `14`      | `1`-`365`                | Verwijdert oude frames; kaarten, waarnemingen en stand-ups blijven behouden                   |

Zonder `nodeId` geeft Logbook de voorkeur aan een verbonden app-Node die
`screen.snapshot` aanbiedt en valt het vervolgens terug op een headless Node die
`logbook.snapshot` aanbiedt. In een niet-vastgezette configuratie wordt een mislukte Node achter andere
geschikte Nodes geplaatst. De pauzeschakelaar op het dashboard geldt alleen voor de sessie en wordt gereset wanneer de
Gateway opnieuw start; gebruik `captureEnabled: false` voor een permanente stop.

### Selectie van visueel model

Logbook bepaalt het waarnemingsmodel in deze volgorde:

1. `plugins.entries.logbook.config.visionModel`
2. de eerste Codex-vermelding met afbeeldingsondersteuning onder `tools.media.image.models`
3. de eerste Codex-vermelding met afbeeldingsondersteuning onder `tools.media.models`

Andere mediaproviders worden overgeslagen omdat zij momenteel niet het contract voor
gestructureerde extractie aanbieden dat Logbook vereist. Als u
`tools.media.image.enabled: false` instelt, worden geleende mediastandaarden uitgeschakeld, maar een
expliciete Logbook-waarde voor `visionModel` blijft van toepassing.

## Dashboardtabblad

- **Tijdlijn**: uitvouwbare kaarten per activiteit met categoriekleuren, de hoofdapp,
  afleidingslabels en een belangrijk snapshotframe.
- **Dag in één oogopslag**: focusverhouding, uitsplitsing per categorie, meest gebruikte apps.
- **Dagelijkse stand-up**: zet gisteren en vandaag om in een kant-en-klare update.
- **Vragen over uw dag**: vragen in natuurlijke taal die worden beantwoord op basis van de bijgehouden
  tijdlijn ("wanneer heb ik de Gateway-PR beoordeeld?").
- **Nu analyseren**: sluit het huidige vastlegvenster onmiddellijk in plaats van
  op het analyse-interval te wachten.

## Gateway-methoden

Logbook registreert deze RPC-methoden van de Gateway:

| Methode               | Parameters               | Bereik           | Resultaat                                                                |
| --------------------- | ------------------------ | ---------------- | ------------------------------------------------------------------------ |
| `logbook.status`      | geen                     | `operator.read`  | Status van vastleggen, analyse, model, Node, Gateway-dag en Gateway-tijdzone |
| `logbook.days`        | geen                     | `operator.read`  | Dagen met aantallen tijdlijnkaarten en tijdsgrenzen van kaarten          |
| `logbook.timeline`    | `{ day?: "YYYY-MM-DD" }` | `operator.read`  | Afgeleide kaarten en dagstatistieken; standaard de huidige dag van de Gateway |
| `logbook.frames`      | `{ startMs, endMs }`     | `operator.write` | Framemetadata binnen het gevraagde bereik in epochmilliseconden          |
| `logbook.frame`       | `{ frameId }`            | `operator.write` | Eén onbewerkt JPEG-frame als base64                                      |
| `logbook.standup`     | `{ day?, refresh? }`     | `operator.write` | Gecachte of opnieuw gegenereerde stand-uptekst voor een dag              |
| `logbook.ask`         | `{ day?, question }`     | `operator.write` | Op de tijdlijn gebaseerd antwoord voor een dag                           |
| `logbook.capture.set` | `{ paused }`             | `operator.write` | Pauzestatus alleen voor de sessie en bijgewerkte status                  |
| `logbook.analyze.now` | geen                     | `operator.write` | Start wachtende analyse of retourneert waarom deze niet kon starten      |

De leesmethoden retourneren operationele status of afgeleide tekst. Onbewerkte schermafbeeldingspixels,
acties die modelkosten veroorzaken en runtimewijzigingen vereisen
`operator.write`. Het Control UI-tabblad vereist ook `operator.write`, omdat het
deze acties en voorbeelden van onbewerkte frames beschikbaar stelt; een alleen-lezenclient kan nog steeds
de methoden voor afgeleide tekst rechtstreeks aanroepen.

## Privacyopmerkingen

- Opnamen kunnen alles bevatten wat op het scherm staat, inclusief geheimen. Frames verlaten
  de machine nooit, behalve als bemonsterde invoer voor het geconfigureerde waarnemingsmodel.
- Waarnemingen, recente kaarten en vragen kunnen via het
  standaard agentmodel de machine verlaten tijdens het samenstellen van kaarten, het genereren van stand-ups of vragen en antwoorden. Pas
  het gegevensverwerkingsbeleid van de provider toe op beide modelroutes.
- Gebruik lokale routes voor zowel het gestructureerde waarnemingsmodel als het standaard
  agentmodel wanneer u een volledig lokale pijplijn nodig hebt.
- Frames, de tijdlijndatabase en tijdelijke opnamen worden geschreven met
  bestandsmachtigingen die alleen toegang aan de eigenaar geven.
- Het toevoegen van `screen.snapshot` aan `gateway.nodes.denyCommands` is de
  noodstop voor schermopname: deze blokkeert zowel opname via app-Nodes als Logbooks eigen
  opdracht `logbook.snapshot`.
- Als u `tools.media.image.enabled: false` instelt, stopt Logbook ook met het lenen
  van de media-afbeeldingsmodellen voor analyse; dan wordt alleen een expliciete `visionModel` in de
  pluginconfiguratie gebruikt.

## Problemen oplossen

### Het Logbook-tabblad ontbreekt

Controleer alle drie de voorwaarden:

1. `openclaw plugins list --enabled` bevat `logbook`.
2. De Gateway is opnieuw gestart na de wijziging van de plugin of toelatingslijst.
3. De Control UI-verbinding heeft `operator.write`; alleen-lezensessies ontvangen de
   interactieve tabbladbeschrijving niet.

Als `plugins.allow` is ingesteld, moet deze voor de aanbevolen configuratie
zowel `logbook` als `codex` bevatten.

### Vastleggen meldt een fout

```bash
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw logs --follow
```

- Controleer of de Node `screen.snapshot` of `logbook.snapshot` beschikbaar stelt.
- Verleen toestemming voor Screen Recording op de Mac die de opname maakt.
- Als `nodeId` is geconfigureerd, controleer dan of deze overeenkomt met de Node-id of weergavenaam.
- Controleer of `gateway.nodes.denyCommands` niet
  `screen.snapshot` bevat.

Na drie opeenvolgende fouten past Logbook gedurende tien vastlegintervallen een
vertraging toe en probeert het daarna opnieuw. Een niet-vastgezette configuratie kan overschakelen naar een andere geschikte Node.

### Vastleggen lukt, maar er verschijnen geen kaarten

- De status **Model ontbreekt** betekent dat er geen compatibele route voor
  gestructureerde visuele analyse is gevonden. Schakel de Codex-Plugin in en verifieer deze, of stel een geldig expliciet
  `visionModel` in. Vastgelegde frames blijven in behandeling zolang het model ontbreekt en
  kunnen worden geanalyseerd nadat de configuratie is hersteld.
- Wacht gedurende `analysisIntervalMinutes` of selecteer **Nu analyseren** nadat activiteit
  is vastgelegd.
- Opeenvolgende identieke frames gelden als bewijs van inactiviteit en worden niet opgenomen in
  analysebatches. Wijzig het zichtbare scherm voordat u test.
- Als de nieuwste batch een fout toont, los dan het probleem met het model of de authenticatie op en selecteer
  **Nu analyseren**. Mislukte batches worden alleen opnieuw geprobeerd na die expliciete actie om
  herhaalde modelkosten te voorkomen.

## Gerelateerd

- [Plugins beheren](/nl/plugins/manage-plugins)
- [Codex-harnas](/nl/plugins/codex-harness)
- [Media begrijpen](/nl/nodes/media-understanding)
- [Nodes](/nl/nodes)
- [Problemen met Nodes oplossen](/nl/nodes/troubleshooting)
- [Besturingsinterface](/nl/web/control-ui)
