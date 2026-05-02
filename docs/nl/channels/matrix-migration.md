---
read_when:
    - Een bestaande Matrix-installatie upgraden
    - Versleutelde Matrix-geschiedenis en apparaatstatus migreren
summary: Hoe OpenClaw de vorige Matrix-Plugin ter plaatse upgradet, inclusief herstelbeperkingen voor versleutelde status en handmatige herstelstappen.
title: Matrix-migratie
x-i18n:
    generated_at: "2026-05-02T22:16:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8bc9b875fef0ae08978061a9fc7cbb076617009d79487ca8329e03076103b32c
    source_path: channels/matrix-migration.md
    workflow: 16
---

Upgrade van de vorige openbare `matrix` Plugin naar de huidige implementatie.

Voor de meeste gebruikers vindt de upgrade op zijn plaats plaats:

- de Plugin blijft `@openclaw/matrix`
- het kanaal blijft `matrix`
- je configuratie blijft onder `channels.matrix`
- gecachte referenties blijven onder `~/.openclaw/credentials/matrix/`
- runtime-status blijft onder `~/.openclaw/matrix/`

Je hoeft geen configuratiesleutels te hernoemen of de Plugin opnieuw te installeren onder een nieuwe naam.

## Wat de migratie automatisch doet

Wanneer de Gateway start, en wanneer je [`openclaw doctor --fix`](/nl/gateway/doctor) uitvoert, probeert OpenClaw oude Matrix-status automatisch te repareren.
Voordat een uitvoerbare Matrix-migratiestap status op schijf wijzigt, maakt OpenClaw een gerichte herstelmomentopname aan of hergebruikt deze.

Wanneer je `openclaw update` gebruikt, hangt de exacte trigger af van hoe OpenClaw is geinstalleerd:

- broninstallaties voeren `openclaw doctor --fix` uit tijdens de updateflow en herstarten daarna standaard de Gateway
- pakketbeheerinstallaties werken het pakket bij, voeren een niet-interactieve doctor-pass uit en vertrouwen daarna op de standaard Gateway-herstart zodat het opstarten de Matrix-migratie kan voltooien
- als je `openclaw update --no-restart` gebruikt, wordt opstartgestuurde Matrix-migratie uitgesteld totdat je later `openclaw doctor --fix` uitvoert en de Gateway herstart

Automatische migratie omvat:

- een pre-migratiemomentopname aanmaken of hergebruiken onder `~/Backups/openclaw-migrations/`
- je gecachte Matrix-referenties hergebruiken
- dezelfde accountselectie en `channels.matrix`-configuratie behouden
- de oudste platte Matrix-synchronisatieopslag verplaatsen naar de huidige accountspecifieke locatie
- de oudste platte Matrix-crypto-opslag verplaatsen naar de huidige accountspecifieke locatie wanneer het doelaccount veilig kan worden bepaald
- een eerder opgeslagen decryptiesleutel voor Matrix-room-key-back-ups ophalen uit de oude rust-crypto-opslag, wanneer die sleutel lokaal bestaat
- de meest complete bestaande token-hashopslagroot hergebruiken voor hetzelfde Matrix-account, dezelfde homeserver en dezelfde gebruiker wanneer het toegangstoken later verandert
- naastgelegen token-hashopslagroots scannen op wachtende herstelmetadata voor versleutelde status wanneer het Matrix-toegangstoken is gewijzigd maar de account-/apparaatidentiteit hetzelfde is gebleven
- geback-upte room keys herstellen naar de nieuwe crypto-opslag bij de volgende Matrix-start

Details van momentopnamen:

- OpenClaw schrijft een markeringsbestand naar `~/.openclaw/matrix/migration-snapshot.json` na een succesvolle momentopname, zodat latere opstart- en reparatiepasses hetzelfde archief kunnen hergebruiken.
- Deze automatische Matrix-migratiemomentopnamen maken alleen een back-up van configuratie + status (`includeWorkspace: false`).
- Als Matrix alleen migratiestatus met waarschuwingen heeft, bijvoorbeeld omdat `userId` of `accessToken` nog ontbreekt, maakt OpenClaw de momentopname nog niet aan omdat er geen Matrix-mutatie uitvoerbaar is.
- Als de momentopnamestap mislukt, slaat OpenClaw Matrix-migratie voor die run over in plaats van status te wijzigen zonder herstelpunt.

Over upgrades met meerdere accounts:

- de oudste platte Matrix-opslag (`~/.openclaw/matrix/bot-storage.json` en `~/.openclaw/matrix/crypto/`) kwam uit een lay-out met een enkele opslag, dus OpenClaw kan die alleen migreren naar een bepaald Matrix-accountdoel
- bestaande accountspecifieke verouderde Matrix-opslag wordt per geconfigureerd Matrix-account gedetecteerd en voorbereid

## Wat de migratie niet automatisch kan doen

De vorige openbare Matrix Plugin maakte **niet** automatisch Matrix-room-key-back-ups aan. Deze bewaarde lokale crypto-status en vroeg om apparaatverificatie, maar garandeerde niet dat je room keys naar de homeserver werden geback-upt.

Dat betekent dat sommige versleutelde installaties slechts gedeeltelijk kunnen worden gemigreerd.

OpenClaw kan het volgende niet automatisch herstellen:

- alleen lokaal aanwezige room keys waarvan nooit een back-up is gemaakt
- versleutelde status wanneer het doel-Matrix-account nog niet kan worden bepaald omdat `homeserver`, `userId` of `accessToken` nog niet beschikbaar zijn
- automatische migratie van een gedeelde platte Matrix-opslag wanneer meerdere Matrix-accounts zijn geconfigureerd maar `channels.matrix.defaultAccount` niet is ingesteld
- aangepaste Plugin-padinstallaties die zijn vastgepind op een repopad in plaats van op het standaard Matrix-pakket
- een ontbrekende herstelsleutel wanneer de oude opslag geback-upte sleutels had maar de decryptiesleutel niet lokaal bewaarde

Huidige waarschuwingsscope:

- aangepaste Matrix Plugin-padinstallaties worden zowel door Gateway-start als door `openclaw doctor` getoond

Als je oude installatie alleen lokaal aanwezige versleutelde geschiedenis had waarvan nooit een back-up is gemaakt, kunnen sommige oudere versleutelde berichten na de upgrade onleesbaar blijven.

## Aanbevolen upgradeflow

1. Werk OpenClaw en de Matrix Plugin normaal bij.
   Gebruik bij voorkeur gewoon `openclaw update` zonder `--no-restart`, zodat het opstarten de Matrix-migratie direct kan voltooien.
2. Voer uit:

   ```bash
   openclaw doctor --fix
   ```

   Als Matrix uitvoerbaar migratiewerk heeft, maakt doctor eerst de pre-migratiemomentopname aan of hergebruikt deze en drukt het archiefpad af.

3. Start of herstart de Gateway.
4. Controleer de huidige verificatie- en back-upstatus:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Plaats de herstelsleutel voor het Matrix-account dat je repareert in een accountspecifieke omgevingsvariabele. Voor een enkel standaardaccount is `MATRIX_RECOVERY_KEY` prima. Gebruik voor meerdere accounts een variabele per account, bijvoorbeeld `MATRIX_RECOVERY_KEY_ASSISTANT`, en voeg `--account assistant` toe aan het commando.

6. Als OpenClaw zegt dat een herstelsleutel nodig is, voer je het commando uit voor het bijbehorende account:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Als dit apparaat nog niet is geverifieerd, voer je het commando uit voor het bijbehorende account:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Als de herstelsleutel wordt geaccepteerd en back-up bruikbaar is, maar `Cross-signing verified`
   nog steeds `no` is, voltooi dan zelfverificatie vanuit een andere Matrix-client:

   ```bash
   openclaw matrix verify self
   ```

   Accepteer het verzoek in een andere Matrix-client, vergelijk de emoji of decimalen,
   en typ alleen `yes` wanneer ze overeenkomen. Het commando sluit alleen succesvol af
   nadat `Cross-signing verified` `yes` wordt.

8. Als je bewust onherstelbare oude geschiedenis achterlaat en een nieuwe back-upbasislijn voor toekomstige berichten wilt, voer dan uit:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. Als er nog geen serverside sleutelback-up bestaat, maak er dan een aan voor toekomstig herstel:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Hoe versleutelde migratie werkt

Versleutelde migratie is een proces in twee fasen:

1. Opstarten of `openclaw doctor --fix` maakt de pre-migratiemomentopname aan of hergebruikt deze als versleutelde migratie uitvoerbaar is.
2. Opstarten of `openclaw doctor --fix` inspecteert de oude Matrix-crypto-opslag via de actieve Matrix Plugin-installatie.
3. Als een back-updecriptiesleutel wordt gevonden, schrijft OpenClaw deze naar de nieuwe herstelsleutelflow en markeert room-key-herstel als wachtend.
4. Bij de volgende Matrix-start herstelt OpenClaw geback-upte room keys automatisch naar de nieuwe crypto-opslag.

Als de oude opslag room keys meldt waarvan nooit een back-up is gemaakt, waarschuwt OpenClaw in plaats van te doen alsof herstel is geslaagd.

## Veelvoorkomende berichten en wat ze betekenen

### Upgrade- en detectieberichten

`Matrix plugin upgraded in place.`

- Betekenis: de oude Matrix-status op schijf is gedetecteerd en gemigreerd naar de huidige lay-out.
- Wat te doen: niets, tenzij dezelfde uitvoer ook waarschuwingen bevat.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Betekenis: OpenClaw heeft een herstelarchief aangemaakt voordat Matrix-status werd gewijzigd.
- Wat te doen: bewaar het afgedrukte archiefpad totdat je hebt bevestigd dat de migratie is geslaagd.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Betekenis: OpenClaw heeft een bestaande Matrix-migratiemomentopnamemarkering gevonden en dat archief hergebruikt in plaats van een dubbele back-up te maken.
- Wat te doen: bewaar het afgedrukte archiefpad totdat je hebt bevestigd dat de migratie is geslaagd.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Betekenis: oude Matrix-status bestaat, maar OpenClaw kan deze niet koppelen aan een huidig Matrix-account omdat Matrix niet is geconfigureerd.
- Wat te doen: configureer `channels.matrix` en voer daarna `openclaw doctor --fix` opnieuw uit of herstart de Gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Betekenis: OpenClaw heeft oude status gevonden, maar kan de exacte huidige account-/apparaatroot nog niet bepalen.
- Wat te doen: start de Gateway een keer met een werkende Matrix-login, of voer `openclaw doctor --fix` opnieuw uit nadat gecachte referenties bestaan.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Betekenis: OpenClaw heeft een gedeelde platte Matrix-opslag gevonden, maar weigert te gokken welk benoemd Matrix-account deze moet ontvangen.
- Wat te doen: stel `channels.matrix.defaultAccount` in op het bedoelde account en voer daarna `openclaw doctor --fix` opnieuw uit of herstart de Gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Betekenis: de nieuwe accountspecifieke locatie heeft al een synchronisatie- of crypto-opslag, dus OpenClaw heeft deze niet automatisch overschreven.
- Wat te doen: controleer of het huidige account het juiste is voordat je het conflicterende doel handmatig verwijdert of verplaatst.

`Failed migrating Matrix legacy sync store (...)` of `Failed migrating Matrix legacy crypto store (...)`

- Betekenis: OpenClaw probeerde oude Matrix-status te verplaatsen, maar de bestandssysteembewerking is mislukt.
- Wat te doen: controleer bestandssysteemrechten en schijfstatus en voer daarna `openclaw doctor --fix` opnieuw uit.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Betekenis: OpenClaw heeft een oude versleutelde Matrix-opslag gevonden, maar er is geen huidige Matrix-configuratie om deze aan te koppelen.
- Wat te doen: configureer `channels.matrix` en voer daarna `openclaw doctor --fix` opnieuw uit of herstart de Gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Betekenis: de versleutelde opslag bestaat, maar OpenClaw kan niet veilig bepalen bij welk huidig account/apparaat deze hoort.
- Wat te doen: start de Gateway een keer met een werkende Matrix-login, of voer `openclaw doctor --fix` opnieuw uit nadat gecachte referenties beschikbaar zijn.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Betekenis: OpenClaw heeft een gedeelde platte verouderde crypto-opslag gevonden, maar weigert te gokken welk benoemd Matrix-account deze moet ontvangen.
- Wat te doen: stel `channels.matrix.defaultAccount` in op het bedoelde account en voer daarna `openclaw doctor --fix` opnieuw uit of herstart de Gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Betekenis: OpenClaw heeft oude Matrix-status gedetecteerd, maar de migratie wordt nog geblokkeerd door ontbrekende identiteits- of referentiegegevens.
- Wat te doen: voltooi Matrix-login of configuratie-instelling en voer daarna `openclaw doctor --fix` opnieuw uit of herstart de Gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Betekenis: OpenClaw heeft oude versleutelde Matrix-status gevonden, maar kon het helper-entrypoint uit de Matrix Plugin die die opslag normaal inspecteert niet laden.
- Wat te doen: installeer de Matrix Plugin opnieuw of repareer deze (`openclaw plugins install @openclaw/matrix`, of `openclaw plugins install ./path/to/local/matrix-plugin` voor een repo-check-out) en voer daarna `openclaw doctor --fix` opnieuw uit of herstart de Gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Betekenis: OpenClaw heeft een helperbestandspad gevonden dat buiten de Plugin-root valt of niet door de Plugin-grenscontroles komt, en heeft daarom geweigerd het te importeren.
- Wat te doen: installeer de Matrix-Plugin opnieuw vanuit een vertrouwd pad en voer daarna `openclaw doctor --fix` opnieuw uit of herstart de Gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Betekenis: OpenClaw heeft geweigerd Matrix-status te wijzigen omdat eerst geen herstel-snapshot kon worden gemaakt.
- Wat te doen: los de back-upfout op en voer daarna `openclaw doctor --fix` opnieuw uit of herstart de Gateway.

`Failed migrating legacy Matrix client storage: ...`

- Betekenis: de fallback aan de clientzijde van Matrix heeft oude platte opslag gevonden, maar het verplaatsen is mislukt. OpenClaw breekt die fallback nu af in plaats van stilzwijgend met een nieuwe opslag te starten.
- Wat te doen: controleer bestandssysteemmachtigingen of conflicten, laat de oude status intact en probeer het opnieuw nadat de fout is opgelost.

`Matrix is installed from a custom path: ...`

- Betekenis: Matrix is vastgezet op een padinstallatie, dus mainline-updates vervangen deze niet automatisch door het standaard Matrix-pakket van de repo.
- Wat te doen: installeer opnieuw met `openclaw plugins install @openclaw/matrix` wanneer je wilt terugkeren naar de standaard Matrix-Plugin.

### Herstelberichten voor versleutelde status

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Betekenis: geback-upte ruimtesleutels zijn succesvol hersteld naar de nieuwe crypto-opslag.
- Wat te doen: meestal niets.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Betekenis: sommige oude ruimtesleutels bestonden alleen in de oude lokale opslag en waren nooit geüpload naar Matrix-back-up.
- Wat te doen: verwacht dat sommige oude versleutelde geschiedenis onbeschikbaar blijft, tenzij je die sleutels handmatig kunt herstellen vanaf een andere geverifieerde client.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- Betekenis: er bestaat een back-up, maar OpenClaw kon de herstelsleutel niet automatisch herstellen.
- Wat te doen: voer `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` uit.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Betekenis: OpenClaw heeft de oude versleutelde opslag gevonden, maar kon deze niet veilig genoeg inspecteren om herstel voor te bereiden.
- Wat te doen: voer `openclaw doctor --fix` opnieuw uit. Als dit zich herhaalt, laat dan de oude statusmap intact en herstel via een andere geverifieerde Matrix-client plus `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Betekenis: OpenClaw heeft een conflict met de back-upsleutel gedetecteerd en heeft geweigerd het huidige recovery-key-bestand automatisch te overschrijven.
- Wat te doen: controleer welke herstelsleutel correct is voordat je een herstelopdracht opnieuw probeert.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Betekenis: dit is de harde limiet van de oude opslagindeling.
- Wat te doen: geback-upte sleutels kunnen nog steeds worden hersteld, maar lokaal beperkte versleutelde geschiedenis kan onbeschikbaar blijven.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Betekenis: de nieuwe Plugin heeft herstel geprobeerd, maar Matrix gaf een fout terug.
- Wat te doen: voer `openclaw matrix verify backup status` uit en probeer daarna zo nodig opnieuw met `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

### Handmatige herstelberichten

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Betekenis: OpenClaw weet dat je een back-upsleutel zou moeten hebben, maar deze is niet actief op dit apparaat.
- Wat te doen: voer `openclaw matrix verify backup restore` uit, of stel `MATRIX_RECOVERY_KEY` in en voer zo nodig `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` uit.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- Betekenis: op dit apparaat is momenteel geen herstelsleutel opgeslagen.
- Wat te doen: stel `MATRIX_RECOVERY_KEY` in, voer `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` uit en herstel daarna de back-up.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- Betekenis: de opgeslagen sleutel komt niet overeen met de actieve Matrix-back-up.
- Wat te doen: stel `MATRIX_RECOVERY_KEY` in op de juiste sleutel en voer `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` uit.

Als je accepteert dat onherstelbare oude versleutelde geschiedenis verloren gaat, kun je in plaats daarvan de
huidige back-upbasis opnieuw instellen met `openclaw matrix verify backup reset --yes`. Wanneer het
opgeslagen back-upgeheim defect is, kan die reset ook geheime opslag opnieuw aanmaken, zodat de
nieuwe back-upsleutel na een herstart correct kan laden.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- Betekenis: de back-up bestaat, maar dit apparaat vertrouwt de cross-signing-keten nog niet sterk genoeg.
- Wat te doen: stel `MATRIX_RECOVERY_KEY` in en voer `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` uit.

`Matrix recovery key is required`

- Betekenis: je hebt een herstelstap geprobeerd zonder een herstelsleutel op te geven terwijl die vereist was.
- Wat te doen: voer de opdracht opnieuw uit met `--recovery-key-stdin`, bijvoorbeeld `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Betekenis: de opgegeven sleutel kon niet worden geparseerd of kwam niet overeen met de verwachte indeling.
- Wat te doen: probeer het opnieuw met de exacte herstelsleutel uit je Matrix-client of recovery-key-bestand.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Betekenis: OpenClaw kon de herstelsleutel toepassen, maar Matrix heeft nog steeds geen
  volledig cross-signing-identiteitsvertrouwen voor dit apparaat vastgesteld. Controleer de
  opdrachtuitvoer op `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` en `Device verified by owner`.
- Wat te doen: voer `openclaw matrix verify self` uit, accepteer het verzoek in een andere
  Matrix-client, vergelijk de SAS en typ `yes` alleen wanneer deze overeenkomt. De
  opdracht wacht op volledig Matrix-identiteitsvertrouwen voordat succes wordt gemeld. Gebruik
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  alleen wanneer je de huidige cross-signing-identiteit bewust wilt vervangen.

`Matrix key backup is not active on this device after loading from secret storage.`

- Betekenis: geheime opslag heeft op dit apparaat geen actieve back-upsessie opgeleverd.
- Wat te doen: verifieer eerst het apparaat en controleer daarna opnieuw met `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- Betekenis: dit apparaat kan niet herstellen vanuit geheime opslag totdat apparaatverificatie is voltooid.
- Wat te doen: voer eerst `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin` uit.

### Berichten voor aangepaste Plugin-installatie

`Matrix is installed from a custom path that no longer exists: ...`

- Betekenis: je Plugin-installatierecord verwijst naar een lokaal pad dat niet meer bestaat.
- Wat te doen: installeer opnieuw met `openclaw plugins install @openclaw/matrix`, of, als je vanuit een repo-checkout draait, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Als versleutelde geschiedenis nog steeds niet terugkomt

Voer deze controles in volgorde uit:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Als de back-up succesvol wordt hersteld maar in sommige oude kamers nog steeds geschiedenis ontbreekt, zijn die ontbrekende sleutels waarschijnlijk nooit geback-upt door de vorige Plugin.

## Als je opnieuw wilt beginnen voor toekomstige berichten

Als je accepteert dat onherstelbare oude versleutelde geschiedenis verloren gaat en alleen een schone back-upbasis voor de toekomst wilt, voer deze opdrachten in volgorde uit:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Als het apparaat daarna nog steeds niet geverifieerd is, voltooi dan de verificatie vanuit je Matrix-client door de SAS-emoji of decimale codes te vergelijken en te bevestigen dat ze overeenkomen.

## Gerelateerd

- [Matrix](/nl/channels/matrix): kanaalinstelling en configuratie.
- [Matrix-pushregels](/nl/channels/matrix-push-rules): routering van meldingen.
- [Doctor](/nl/gateway/doctor): statuscontrole en automatische migratietrigger.
- [Migratiehandleiding](/nl/install/migrating): alle migratiepaden (machineverplaatsingen, imports tussen systemen).
- [Plugins](/nl/tools/plugin): Plugin-installatie en registratie.
