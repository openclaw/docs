---
read_when:
    - Een bestaande Matrix-installatie upgraden
    - Versleutelde Matrix-geschiedenis en apparaatstatus migreren
summary: Hoe OpenClaw de vorige Matrix-Plugin ter plaatse upgradet, inclusief beperkingen voor herstel van versleutelde status en handmatige herstelstappen.
title: Matrix-migratie
x-i18n:
    generated_at: "2026-07-16T15:11:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 33d5ac134338c8032ca1507ceee6eade2d37b3c86f0045fb883304ad208cd5e5
    source_path: channels/matrix-migration.md
    workflow: 16
---

Upgrade van de vorige openbare `matrix`-plugin naar de huidige implementatie.

Voor de meeste gebruikers verloopt de upgrade zonder wijzigingen:

- de plugin blijft `@openclaw/matrix`
- het kanaal blijft `matrix`
- je configuratie blijft onder `channels.matrix`
- in de cache opgeslagen referenties blijven onder `~/.openclaw/credentials/matrix/`
- de runtimestatus blijft onder `~/.openclaw/matrix/`

Je hoeft configuratiesleutels niet te hernoemen en de plugin niet opnieuw onder een nieuwe naam te installeren.
Het hoofdpackage `openclaw` bevat geen Matrix-runtimecode of
afhankelijkheden van de Matrix-SDK meer. Als `openclaw channels status` aangeeft dat Matrix is geconfigureerd, maar de
plugin niet is geïnstalleerd, voer je `openclaw doctor --fix` of
`openclaw plugins install @openclaw/matrix` uit; installeer geen Matrix-SDK-packages
in het hoofdpackage van OpenClaw.

## Wat de migratie automatisch doet

De Matrix-migratie wordt uitgevoerd wanneer je [`openclaw doctor --fix`](/nl/gateway/doctor) uitvoert en, als terugvaloptie, wanneer de Matrix-client start en nog steeds bestandsgebaseerde nevenstatus naast de SQLite-opslag aantreft.

De automatische migratie omvat:

- hergebruik van je in de cache opgeslagen Matrix-referenties
- behoud van dezelfde accountselectie en `channels.matrix`-configuratie
- import van bestandsgebaseerde nevenstatus (`bot-storage.json`-synchronisatiecache, `recovery-key.json`, `legacy-crypto-migration.json`, IndexedDB-momentopnamen) naar de Matrix-status in SQLite; gemigreerde bestanden worden gearchiveerd met het achtervoegsel `.migrated`
- hergebruik van de meest volledige bestaande opslaghoofdmap voor tokenhashes voor hetzelfde Matrix-account, dezelfde homeserver, gebruiker en hetzelfde apparaat wanneer het toegangstoken later verandert

## Upgraden vanaf OpenClaw-releases ouder dan 2026.4

Releases tot en met de 2026.6-reeks migreerden ook de oorspronkelijke platte Matrix-indeling met één opslag
(`~/.openclaw/matrix/bot-storage.json` plus
`~/.openclaw/matrix/crypto/`) en bereidden herstel van versleutelde status uit de
oude Rust-crypto-opslag voor. Huidige releases bevatten die migratie niet meer.

Als je een installatie upgradet die nog steeds de platte indeling gebruikt, voer dan eerst
een upgrade uit naar een 2026.6-release, voer `openclaw doctor --fix` uit en start de Gateway
eenmaal, zodat de platte opslag en eventuele herstelbare kamersleutels worden gemigreerd. Werk daarna
bij naar de nieuwste release.

De vorige openbare Matrix-plugin maakte **niet** automatisch back-ups van Matrix-kamersleutels. Als je oude installatie uitsluitend lokale versleutelde geschiedenis bevatte waarvan nooit een back-up is gemaakt, kunnen sommige oudere versleutelde berichten na de upgrade onleesbaar blijven, ongeacht het migratiepad.

## Aanbevolen upgradeproces

1. Werk OpenClaw en de Matrix-plugin op de gebruikelijke manier bij.
2. Voer het volgende uit:

   ```bash
   openclaw doctor --fix
   ```

3. Start of herstart de Gateway.
4. Controleer de huidige verificatie- en back-upstatus:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Plaats de herstelsleutel voor het Matrix-account dat je herstelt in een accountspecifieke omgevingsvariabele. Voor één standaardaccount volstaat `MATRIX_RECOVERY_KEY`. Gebruik voor meerdere accounts één variabele per account, bijvoorbeeld `MATRIX_RECOVERY_KEY_ASSISTANT`, en voeg `--account assistant` aan de opdracht toe.

6. Als OpenClaw aangeeft dat een herstelsleutel nodig is, voer je de opdracht voor het bijbehorende account uit:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Als dit apparaat nog steeds niet is geverifieerd, voer je de opdracht voor het bijbehorende account uit:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Als de herstelsleutel wordt geaccepteerd en de back-up bruikbaar is, maar `Cross-signing verified`
   nog steeds `no` is, voltooi je de zelfverificatie vanuit een andere Matrix-client:

   ```bash
   openclaw matrix verify self
   ```

   Accepteer het verzoek in een andere Matrix-client, vergelijk de emoji of decimale codes
   en typ alleen `yes` wanneer ze overeenkomen. De opdracht wacht op volledig vertrouwen in de Matrix-
   identiteit voordat succes wordt gemeld.

8. Als je er bewust voor kiest onherstelbare oude geschiedenis achter te laten en een nieuwe basisback-up voor toekomstige berichten wilt, voer je het volgende uit:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

   Voeg `--rotate-recovery-key` alleen toe wanneer de oude herstelsleutel de nieuwe back-up niet meer mag kunnen ontgrendelen.

9. Als er nog geen serverback-up van sleutels bestaat, maak je er een voor toekomstig herstel:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Veelvoorkomende meldingen en wat ze betekenen

`Failed migrating legacy Matrix client storage: ...`

- Betekenis: de terugvaloptie aan de clientzijde van Matrix heeft bestandsgebaseerde nevenstatus gevonden, maar de import naar SQLite is mislukt. OpenClaw draait voltooide verplaatsingen terug en breekt die terugvaloptie af in plaats van ongemerkt met een nieuwe opslag te starten.
- Wat te doen: controleer bestandssysteemmachtigingen of conflicten, houd de oude status intact en probeer het opnieuw nadat je de fout hebt opgelost.

`Matrix is installed from a custom path: ...`

- Betekenis: Matrix is vastgezet op een installatie vanaf een pad, waardoor updates van de hoofdversie deze niet automatisch vervangen door het standaardpackage voor Matrix.
- Wat te doen: installeer opnieuw met `openclaw plugins install @openclaw/matrix` wanneer je wilt terugkeren naar de standaard-Plugin voor Matrix.

`Matrix is installed from a custom path that no longer exists: ...`

- Betekenis: de installatierecord van je plugin verwijst naar een lokaal pad dat niet meer bestaat.
- Wat te doen: installeer opnieuw met `openclaw plugins install @openclaw/matrix`, of gebruik `openclaw plugins install ./path/to/local/matrix-plugin` als je vanuit een repository-checkout werkt. `openclaw doctor --fix` kan de verouderde verwijzingen naar de Matrix-plugin ook voor je verwijderen.

### Meldingen voor handmatig herstel

`openclaw matrix verify status` en `openclaw matrix verify backup status` tonen een regel `Backup issue:` plus `Next steps:`-instructies wanneer de back-up van kamersleutels op dit apparaat niet in orde is:

| Probleem met back-up                                                  | Betekenis                                          | Oplossing                                                                                                                                |
| --------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `no room-key backup exists on the homeserver`                         | niets om van te herstellen                         | `openclaw matrix verify bootstrap` om een back-up van kamersleutels te maken                                                               |
| `backup decryption key is not loaded on this device`                  | sleutel bestaat, maar is hier niet actief          | `openclaw matrix verify backup restore`; als de sleutel nog steeds niet kan worden geladen, stuur je de herstelsleutel door via `--recovery-key-stdin` |
| `backup decryption key could not be loaded from secret storage (...)` | laden uit geheime opslag is mislukt of niet ondersteund | stuur de herstelsleutel door: `printf '%s\n' "$MATRIX_RECOVERY_KEY" \| openclaw matrix verify backup restore --recovery-key-stdin`               |
| `backup key mismatch (...)`                                           | opgeslagen sleutel komt niet overeen met de actieve serverback-up | voer `verify backup restore --recovery-key-stdin` opnieuw uit met de actieve serverback-upsleutel, of `verify backup reset --yes` voor een nieuwe basis |
| `backup signature chain is not trusted by this device`                | apparaat vertrouwt de keten voor kruisondertekening nog niet | `verify device --recovery-key-stdin`, daarna `verify self` vanuit een andere geverifieerde client als het vertrouwen nog onvolledig is |
| `backup exists but is not active on this device`                      | serverback-up aanwezig, lokale sessie inactief     | verifieer eerst het apparaat en controleer daarna opnieuw met `openclaw matrix verify backup status`                                               |
| `backup trust state could not be fully determined`                    | diagnostiek leverde geen uitsluitsel               | `openclaw matrix verify status --verbose`                                                                                                 |

Andere herstelfouten:

`Matrix recovery key is required`

- Betekenis: je hebt een herstelstap geprobeerd zonder een herstelsleutel op te geven terwijl die vereist was.
- Wat te doen: voer de opdracht opnieuw uit met `--recovery-key-stdin`, bijvoorbeeld `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Betekenis: de opgegeven sleutel kon niet worden geparseerd of kwam niet overeen met de verwachte indeling.
- Wat te doen: probeer het opnieuw met de exacte herstelsleutel uit je Matrix-client of export van de herstelsleutel.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Betekenis: de herstelsleutel heeft bruikbaar back-upmateriaal ontgrendeld, maar Matrix heeft voor dit apparaat nog geen volledig identiteitsvertrouwen via kruisondertekening vastgesteld. Controleer de uitvoer van de opdracht op `Recovery key accepted`, `Backup usable`, `Cross-signing verified` en `Device verified by owner`.
- Wat te doen: voer `openclaw matrix verify self` uit, accepteer het verzoek in een andere Matrix-client, vergelijk de SAS en typ alleen `yes` wanneer deze overeenkomt. Gebruik `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing` alleen wanneer je de huidige identiteit voor kruisondertekening bewust wilt vervangen.

Als je het verlies van onherstelbare oude versleutelde geschiedenis accepteert, kun je in plaats daarvan de
huidige basisback-up opnieuw instellen met `openclaw matrix verify backup reset --yes`. Wanneer het
opgeslagen back-upgeheim defect is, herstelt die reset ook de geheime opslag, zodat de
nieuwe back-upsleutel na een herstart correct kan worden geladen.

## Als de versleutelde geschiedenis nog steeds niet terugkomt

Voer deze controles in deze volgorde uit:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Als de back-up met succes wordt hersteld, maar in sommige oude kamers nog steeds geschiedenis ontbreekt, heeft de vorige plugin waarschijnlijk nooit een back-up van die ontbrekende sleutels gemaakt.

## Als je opnieuw wilt beginnen voor toekomstige berichten

Als je het verlies van onherstelbare oude versleutelde geschiedenis accepteert en voortaan alleen een schone basisback-up wilt, voer je deze opdrachten in deze volgorde uit:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Als het apparaat daarna nog steeds niet is geverifieerd, voltooi je de verificatie vanuit je Matrix-client door de SAS-emoji of decimale codes te vergelijken en te bevestigen dat ze overeenkomen.

## Gerelateerd

- [Matrix](/nl/channels/matrix): kanaalinstallatie en configuratie.
- [Matrix-pushregels](/nl/channels/matrix-push-rules): routering van meldingen.
- [Doctor](/nl/gateway/doctor): statuscontrole en automatische migratietrigger.
- [Migratiehandleiding](/nl/install/migrating): alle migratiepaden (machines verplaatsen, imports tussen systemen).
- [Plugins](/nl/tools/plugin): installatie en registratie van plugins.
