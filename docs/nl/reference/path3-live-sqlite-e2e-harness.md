---
read_when:
    - Je verifieert de omschakeling van Path 3 naar SQLite-opslag met een live Gateway
    - Je moet verwachte afwijkingen in verouderde JSONL onderscheiden van runtimefouten
    - Je bouwt of beoordeelt de agentgestuurde live SQLite-E2E-harnasopstelling
summary: Ontwerp voor live Gateway-bewijs van de Path 3-omschakeling van sessies/transcripten naar SQLite
title: Pad 3 live SQLite-E2E-harnas
x-i18n:
    generated_at: "2026-07-16T16:21:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2749bf47cb4967bc80a5ed37a12f2a553f3b388ed8cd90cfb3217e1b5e8afae9
    source_path: reference/path3-live-sqlite-e2e-harness.md
    workflow: 16
---

De Path 3 live SQLite E2E-harness bewijst dat de Gateway SQLite gebruikt als de
canonieke opslag voor sessies en transcripties, terwijl verouderde JSONL-bestanden
invoer voor migratie of archiefmateriaal blijven. Het is een bewijsharness voor
beheerders, geen normale diagnostische functie voor gebruikers.

Nadat een Gateway verkeer na de migratie heeft verwerkt, is pariteit met verouderde
JSONL-bestanden niet langer een geldig signaal voor de runtimegezondheid. Een gezonde
gemigreerde Gateway kan SQLite-transcriptierijen hebben waarvan de aantallen afwijken
van die in verouderde JSONL-bestanden, omdat nieuwe beurten alleen SQLite
behoren bij te werken. De live harness moet daarom bij elke stap het gedrag van de
Gateway, wijzigingen in SQLite-rijen, de inactiviteit van verouderde bestanden en de
logboekgezondheid meten.

## Opdrachtvorm

De beoogde live opdracht is:

```bash
node scripts/path3-live-sqlite-e2e.mjs \
  --url http://127.0.0.1:18789 \
  --agent main \
  --session-key agent:main:path3-live-e2e:<timestamp> \
  --json
```

De opdracht maakt verbinding met een Gateway die al actief is. De opdracht start,
stopt of importeert niets en voert de migratie niet opnieuw uit, tenzij later een
expliciete migratiemodus wordt toegevoegd. Een CI-variant of geïsoleerde lokale
variant kan `test/helpers/openclaw-test-instance.ts` gebruiken, maar het live bewijspad moet
de daadwerkelijke Gateway van de beheerder en de echte SQLite-database per agent
inspecteren.

## Geïsoleerd bewijs met gebouwde CLI

De bewijsrunner voor de gebouwde CLI vult een geïsoleerde verouderde sessieopslag,
start de opnieuw gebouwde Gateway en bewijst dat tijdens het opstarten actieve
verouderde sessies in SQLite worden geïmporteerd voordat runtimelezingen beginnen.
Deze mag `openclaw doctor --fix` niet uitvoeren vóór de eerste start van de
Gateway, omdat daarmee het handmatige migratiepad zou worden bewezen in plaats van
het upgradepad dat gebruikers bij de eerste keer opstarten na de omschakeling krijgen.

Na de opstartimport mag het geïsoleerde bewijs
`openclaw doctor --session-sqlite inspect` en
`openclaw doctor --session-sqlite validate` uitvoeren als diagnostisch bewijs. Die
doctor-opdrachten sturen de migratie voor het bewijs van de opstartupgrade niet aan.
Afzonderlijke scenario's voor doctor-import moeten verouderde transcriptiebestanden
plus trajectory-nevenbestanden aanmaken en verifiëren dat doctor die artefacten
archiveert terwijl SQLite canoniek blijft.

## Controle vooraf

De controle vooraf verzamelt een uitgangssituatie en mislukt voordat een bewijsbeurt
wordt verzonden als de Gateway niet bruikbaar is:

- `GET /health` en de uitgebreide status van de Gateway moeten een actieve,
  bereikbare Gateway melden.
- De versies van de CLI en Gateway moeten overeenkomen met de geteste branch.
- De harness registreert een logboekcursor voor het actieve bestandslogboek van de Gateway.
- De harness registreert de aantallen per agent in de SQLite-tabellen voor `sessions`,
  `session_entries`, `transcript_events`, `transcript_event_identities` en
  `session_routes`.
- De harness registreert `mtime`, `size` en het bestaan van verouderde
  `sessions.json`, JSONL-bestanden waarnaar wordt verwezen en mogelijke JSONL-paden
  voor bewijssessies.
- `lsof -p <gateway-pid>` moet SQLite DB/WAL/SHM-handles tonen en geen actieve
  `.jsonl`- of `sessions.json`-handles.

`openclaw doctor --session-sqlite validate` dient in de live modus alleen ter informatie.
Na verkeer na de omschakeling kan deze verwachte afwijkingen van verouderde bestanden
melden. De harness moet doctor-uitvoer gebruiken voor classificatie en
migratie-inventarisatie, niet als doorslaggevend criterium voor slagen of mislukken
van de runtime.

## Agentgestuurd scenario

Het live scenario gebruikt een speciale bewijssessiesleutel en stuurt de Gateway
waar mogelijk via openbare RPC-paden aan. Eén agentbeurt zou voldoende moeten zijn
om normale persistentie te activeren, maar het volledige bewijs moet de 3.1b-naden
dekken waarvoor eerder afzonderlijke live controles nodig waren:

- Normale chatbeurt: maak de bewijssessie aan of hergebruik deze, verzend een echte
  agentprompt, wacht op het definitieve assistentresultaat en verifieer `chat.history` of
  een gelijkwaardige Gateway-projectie.
- Transcriptie-identiteit: verifieer dat dezelfde markering voorkomt in de Gateway-geschiedenis en in
  SQLite-transcriptierijen, inclusief rijen met een stabiele gebeurtenisidentiteit indien aanwezig.
- Toegangsfuncties voor sessiemetadata: lees de bewijssessie en geselecteerde bestaande live
  sessies via toegangsfuncties voor Gateway/sessies en vergelijk ze met SQLite-rijen.
- Projectie van sessiepatch: pas een omkeerbare wijziging van model-/sessiemetadata toe op
  de bewijssessie en verifieer vervolgens dat de geprojecteerde rij en het Gateway-antwoord overeenkomen.
- Levenscyclus van Compaction-controlepunten: vermeld, vertak en herstel een controlepunt uitsluitend
  voor de bewijssessie of een synthetische fixturesessie die door de harness is gemaakt.
- Herstel na herstart: voer het veilige pad voor herstelmarkeringen uit voor een gecontroleerde
  bewijssessie of een geïsoleerde testinstantie; de live modus mag deze stap alleen uitvoeren wanneer
  de doelsessies expliciet en omkeerbaar zijn.
- Opschoningslevenscyclus: verwijder of reset de bewijssessie en verifieer vervolgens de
  SQLite-levenscyclusrijen en de gearchiveerde transcriptiestatus.

Transportspecifieke naden die niet veilig op de live Gateway van de beheerder
kunnen worden geactiveerd, zoals inkomend WhatsApp- of spraakoproepverkeer, moeten
runtimeprobes op eigenaarsniveau tegen hetzelfde SQLite-contract gebruiken in plaats
van extern transport na te bootsen.

## Asserties per stap

Elke stap maakt momentopnamen van de toestand vóór en na de stap en schrijft een
gestructureerde assertieregistratie:

- De aantallen SQLite-rijen nemen alleen toe waar dat wordt verwacht.
- Trajectory-runtimerijen nemen toe voor bewijssessies met markeringen die
  runtimegebeurtenissen registreren.
- De rij van de bewijssessie heeft de verwachte `session_id`, status, tijdstempels,
  metadata en routeringsrijen.
- De Gateway-projectie voor geschiedenis/sessies komt overeen met het einde van de SQLite-transcriptie.
- Er wordt geen JSONL-bestand voor de bewijssessie gemaakt of gewijzigd.
- Er wordt geen `.trajectory.jsonl`-, `.trajectory-path.json`- of
  van een markering afgeleid `trajectory/<session>.jsonl`-nevenbestand voor de bewijssessie gemaakt.
- Bestaande verouderde JSONL-bestanden en `sessions.json` blijven ongewijzigd, tenzij de
  stap expliciet een offline migratie- of archiveringsbewerking is.
- Het Gateway-proces opent geen `.jsonl`- of `sessions.json`-handles.
- Logboeken sinds de vorige cursor bevatten geen `ERROR`, `FATAL`, `SQLITE_`,
  `no such column`, onbeschikbare sessieopslag, mislukking bij herstel na herstart of
  waarschuwing over transcriptieafstemming, tenzij het scenario dit expliciet toestaat.

De logboekscan maakt deel uit van het contract voor slagen of mislukken. Een Gateway
die op gezondheidscontroles reageert maar SQLite-schemafouten of herhaaldelijke
mislukkingen bij transcriptieafstemming meldt, is niet geslaagd voor Path 3.

## Bewijsartefact

De harness moet bewijs schrijven onder `.artifacts/path3-live-e2e/<timestamp>/`
en dit buiten git houden:

- `summary.json`: opdrachtargumenten, Gateway-versie, resultaat, mislukte assertie en
  artefactpaden.
- `sqlite-before.json` en `sqlite-after.json`: aantallen rijen en geselecteerde bewijsrijen.
- `legacy-files.json`: bestaan van verouderde bestanden, `mtime`, grootte en of elk
  bestand is gewijzigd.
- `gateway-log-scan.json`: cursorbereik, overeenkomende logboekregels en beslissingen
  over de toestemmingslijst.
- `events.jsonl`: geordende observaties per stap die geschikt zijn voor bewijsreacties bij PR's.

Het PR-bewijs moet deze artefacten samenvatten in plaats van volledige
transcripties of inhoud van privéberichten te plakken.

## Veiligheidsregels

- De live modus mag nooit verouderde JSONL opnieuw importeren terwijl de Gateway actief is.
- De live modus mag sessies die geen bewijssessies zijn niet wijzigen, behalve voor expliciet geselecteerde,
  omkeerbare reparatieprobes.
- Elke destructieve of brede migratiestap vereist een nieuwe back-up van de
  betrokken SQLite-DB en de map met verouderde sessies.
- Back-ups moeten beperkt blijven tot de betrokken agent-DB/sessiemap en tijdens
  één bewijsuitvoering worden hergebruikt om onbeperkte groei van het schijfgebruik te voorkomen.
- De opschoningsstap mag geen bewijssessie, bewijs-JSONL of gewijzigd verouderd
  bestand achterlaten, tenzij de aanroeper `--keep-artifacts` doorgeeft.

## Geslaagd resultaat

Een geslaagde live uitvoering betekent dat de Gateway een echte agentgestuurde
sessiestroom heeft geaccepteerd, alle waargenomen canonieke toestand zich in SQLite
bevond, verouderde runtimebestanden inactief bleven en de logboekgezondheid gedurende
het gemeten tijdvenster schoon bleef. Dit betekent niet dat de pariteit met verouderde
JSONL na live verkeer intact blijft; live afwijking wordt verwacht zodra SQLite de
canonieke opslag is.
