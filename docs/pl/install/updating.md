---
read_when:
    - Aktualizacja OpenClaw
    - Coś przestaje działać po aktualizacji
summary: Bezpieczne aktualizowanie OpenClaw (instalacja globalna lub ze źródeł) oraz strategia przywracania poprzedniej wersji
title: Aktualizacja
x-i18n:
    generated_at: "2026-05-03T21:34:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9e26ea71748dfd1573cdca01126bf29ebc56be56eac604e2b6a009b463820d1
    source_path: install/updating.md
    workflow: 16
---

Utrzymuj OpenClaw w aktualnej wersji.

## Zalecane: `openclaw update`

Najszybszy sposób aktualizacji. Wykrywa typ instalacji (npm lub git), pobiera najnowszą wersję, uruchamia `openclaw doctor` i restartuje gateway.

```bash
openclaw update
```

Aby przełączyć kanały albo wskazać konkretną wersję:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`openclaw update` nie przyjmuje `--verbose`. Do diagnostyki aktualizacji użyj
`--dry-run`, aby podejrzeć zaplanowane działania, `--json`, aby uzyskać wyniki strukturalne, albo
`openclaw update status --json`, aby sprawdzić stan kanału i dostępności. Instalator ma własną flagę `--verbose`, ale ta flaga nie jest częścią
`openclaw update`.

`--channel beta` preferuje betę, ale środowisko wykonawcze wraca do stable/latest, gdy
tag beta nie istnieje albo jest starszy niż najnowsze stabilne wydanie. Użyj `--tag beta`,
jeśli chcesz surowego npm dist-tag beta do jednorazowej aktualizacji pakietu.

Zobacz [Kanały deweloperskie](/pl/install/development-channels), aby poznać semantykę kanałów.

## Przełączanie między instalacjami npm i git

Używaj kanałów, gdy chcesz zmienić typ instalacji. Aktualizator zachowuje Twój
stan, konfigurację, dane uwierzytelniające i obszar roboczy w `~/.openclaw`; zmienia tylko to,
z której instalacji kodu OpenClaw korzystają CLI i gateway.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

Najpierw uruchom z `--dry-run`, aby podejrzeć dokładne przełączenie trybu instalacji:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Kanał `dev` zapewnia checkout git, buduje go i instaluje globalne CLI
z tego checkoutu. Kanały `stable` i `beta` używają instalacji pakietowych. Jeśli
gateway jest już zainstalowany, `openclaw update` odświeża metadane usługi
i restartuje ją, chyba że przekażesz `--no-restart`.

## Alternatywa: ponownie uruchom instalator

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Dodaj `--no-onboard`, aby pominąć onboarding. Aby wymusić konkretny typ instalacji przez
instalator, przekaż `--install-method git --no-onboard` albo
`--install-method npm --no-onboard`.

Jeśli `openclaw update` nie powiedzie się po fazie instalacji pakietu npm, uruchom ponownie
instalator. Instalator nie wywołuje starego aktualizatora; uruchamia bezpośrednio globalną
instalację pakietu i może odzyskać częściowo zaktualizowaną instalację npm.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Aby przypiąć odzyskiwanie do konkretnej wersji albo dist-tag, dodaj `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternatywa: ręcznie przez npm, pnpm albo bun

```bash
npm i -g openclaw@latest
```

Gdy `openclaw update` zarządza globalną instalacją npm, najpierw instaluje cel w
tymczasowym prefiksie npm, weryfikuje spis pakietowego `dist`, a następnie podmienia
czyste drzewo pakietu do rzeczywistego globalnego prefiksu. Zapobiega to nakładaniu przez npm
nowego pakietu na nieaktualne pliki ze starego pakietu. Jeśli polecenie instalacji się nie powiedzie,
OpenClaw ponawia próbę raz z `--omit=optional`. Ta ponowna próba pomaga hostom, na których natywne
opcjonalne zależności nie mogą się skompilować, zachowując widoczność pierwotnego błędu,
jeśli obejście również się nie powiedzie.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Zaawansowane tematy instalacji npm

<AccordionGroup>
  <Accordion title="Drzewo pakietów tylko do odczytu">
    OpenClaw traktuje pakietowe instalacje globalne jako tylko do odczytu w czasie działania, nawet gdy globalny katalog pakietu jest zapisywalny dla bieżącego użytkownika. Instalacje pakietów Plugin znajdują się w należących do OpenClaw korzeniach npm/git w katalogu konfiguracji użytkownika, a uruchamianie Gateway nie modyfikuje drzewa pakietu OpenClaw.

    Niektóre konfiguracje npm w Linuksie instalują pakiety globalne w katalogach należących do roota, takich jak `/usr/lib/node_modules/openclaw`. OpenClaw obsługuje taki układ, ponieważ polecenia instalacji/aktualizacji Plugin zapisują poza tym globalnym katalogiem pakietu.

  </Accordion>
  <Accordion title="Utwardzone jednostki systemd">
    Przyznaj OpenClaw dostęp zapisu do jego korzeni konfiguracji/stanu, aby jawne instalacje Plugin, aktualizacje Plugin i czyszczenie przez doctor mogły utrwalać swoje zmiany:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Wstępne sprawdzenie miejsca na dysku">
    Przed aktualizacjami pakietów i jawnymi instalacjami Plugin OpenClaw podejmuje najlepszą możliwą próbę sprawdzenia miejsca na dysku dla woluminu docelowego. Mała ilość miejsca powoduje ostrzeżenie ze sprawdzoną ścieżką, ale nie blokuje aktualizacji, ponieważ limity systemu plików, migawki i woluminy sieciowe mogą zmienić się po sprawdzeniu. Rzeczywista instalacja przez menedżera pakietów i weryfikacja po instalacji pozostają autorytatywne.
  </Accordion>
</AccordionGroup>

## Automatyczny aktualizator

Automatyczny aktualizator jest domyślnie wyłączony. Włącz go w `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Kanał    | Zachowanie                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Czeka `stableDelayHours`, a następnie stosuje aktualizację z deterministycznym jitterem w ramach `stableJitterHours` (rozproszona wdrożenie). |
| `beta`   | Sprawdza co `betaCheckIntervalHours` (domyślnie: co godzinę) i stosuje natychmiast.                              |
| `dev`    | Brak automatycznego stosowania. Użyj ręcznie `openclaw update`.                                                           |

Gateway zapisuje również wskazówkę aktualizacji przy starcie (wyłącz przez `update.checkOnStart: false`).
W celu obniżenia wersji albo odzyskiwania po incydencie ustaw `OPENCLAW_NO_AUTO_UPDATE=1` w środowisku gateway, aby zablokować automatyczne stosowanie aktualizacji nawet wtedy, gdy skonfigurowano `update.auto.enabled`. Wskazówki aktualizacji przy starcie nadal mogą działać, chyba że `update.checkOnStart` także zostanie wyłączone.

Aktualizacje menedżera pakietów żądane przez aktywny handler płaszczyzny sterowania Gateway
wymuszają restart aktualizacji bez odroczenia i bez cooldownu po podmianie pakietu. Pozwala to
uniknąć pozostawienia starego procesu w pamięci na tyle długo, aby leniwie załadował fragmenty
z drzewa pakietu, które zostało już zastąpione. Powłokowe `openclaw update`
pozostaje preferowaną ścieżką dla instalacji nadzorowanych, ponieważ może zatrzymać i
zrestartować usługę wokół aktualizacji.

## Po aktualizacji

<Steps>

### Uruchom doctor

```bash
openclaw doctor
```

Migruje konfigurację, audytuje zasady DM i sprawdza kondycję gateway. Szczegóły: [Doctor](/pl/gateway/doctor)

### Zrestartuj gateway

```bash
openclaw gateway restart
```

### Zweryfikuj

```bash
openclaw health
```

</Steps>

## Wycofanie

### Przypnij wersję (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` pokazuje bieżącą opublikowaną wersję.
</Tip>

### Przypnij commit (źródła)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Aby wrócić do najnowszej wersji: `git checkout main && git pull`.

## Jeśli utkniesz

- Uruchom ponownie `openclaw doctor` i uważnie przeczytaj dane wyjściowe.
- Dla `openclaw update --channel dev` na checkoutach źródłowych aktualizator automatycznie bootstrapuje `pnpm`, gdy jest to potrzebne. Jeśli zobaczysz błąd bootstrapu pnpm/corepack, zainstaluj `pnpm` ręcznie (albo ponownie włącz `corepack`) i uruchom aktualizację ponownie.
- Sprawdź: [Rozwiązywanie problemów](/pl/gateway/troubleshooting)
- Zapytaj na Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Powiązane

- [Przegląd instalacji](/pl/install): wszystkie metody instalacji.
- [Doctor](/pl/gateway/doctor): kontrole kondycji po aktualizacjach.
- [Migracja](/pl/install/migrating): przewodniki po migracji głównych wersji.
