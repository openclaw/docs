---
read_when:
    - Aktualizacja OpenClaw
    - Coś przestaje działać po aktualizacji
summary: Bezpieczne aktualizowanie OpenClaw (instalacja globalna lub ze źródła) oraz strategia wycofania
title: Aktualizacja
x-i18n:
    generated_at: "2026-05-07T13:21:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c9ff1d70d74f45efea3c148718e5cbc74001ce3d924b760edc4d68622d23714
    source_path: install/updating.md
    workflow: 16
---

Utrzymuj OpenClaw w aktualnej wersji.

## Zalecane: `openclaw update`

Najszybszy sposób aktualizacji. Wykrywa typ instalacji (npm lub git), pobiera najnowszą wersję, uruchamia `openclaw doctor` i restartuje Gateway.

```bash
openclaw update
```

Aby przełączyć kanały lub wskazać konkretną wersję:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`openclaw update` nie akceptuje `--verbose`. Do diagnostyki aktualizacji użyj
`--dry-run`, aby podejrzeć planowane działania, `--json` dla wyników strukturalnych, albo
`openclaw update status --json`, aby sprawdzić stan kanału i dostępności. Instalator
ma własną flagę `--verbose`, ale ta flaga nie jest częścią
`openclaw update`.

`--channel beta` preferuje beta, ale środowisko wykonawcze wraca do stable/latest, gdy
brakuje tagu beta albo jest on starszy niż najnowsze wydanie stabilne. Użyj `--tag beta`,
jeśli chcesz surowy npm beta dist-tag do jednorazowej aktualizacji pakietu.

Zobacz [Kanały deweloperskie](/pl/install/development-channels), aby poznać semantykę kanałów.

## Przełączanie między instalacjami npm i git

Używaj kanałów, gdy chcesz zmienić typ instalacji. Aktualizator zachowuje Twój
stan, konfigurację, dane uwierzytelniające i przestrzeń roboczą w `~/.openclaw`; zmienia tylko to,
której instalacji kodu OpenClaw używają CLI i Gateway.

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
Gateway jest już zainstalowany, `openclaw update` odświeża metadane usługi
i restartuje ją, chyba że przekażesz `--no-restart`.

## Alternatywa: ponowne uruchomienie instalatora

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Dodaj `--no-onboard`, aby pominąć onboarding. Aby wymusić konkretny typ instalacji przez
instalator, przekaż `--install-method git --no-onboard` lub
`--install-method npm --no-onboard`.

Jeśli `openclaw update` nie powiedzie się po fazie instalacji pakietu npm, uruchom ponownie
instalator. Instalator nie wywołuje starego aktualizatora; uruchamia bezpośrednio
globalną instalację pakietu i może odzyskać częściowo zaktualizowaną instalację npm.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Aby przypiąć odzyskiwanie do konkretnej wersji lub dist-tag, dodaj `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternatywa: ręczne npm, pnpm lub bun

```bash
npm i -g openclaw@latest
```

Preferuj `openclaw update` dla instalacji nadzorowanych, ponieważ może skoordynować
podmianę pakietu z działającą usługą Gateway. Jeśli aktualizujesz ręcznie, gdy
zarządzany Gateway działa, zrestartuj Gateway natychmiast po zakończeniu działania
menedżera pakietów, aby stary proces nie kontynuował obsługi z zastąpionych plików
pakietu.

Gdy `openclaw update` zarządza globalną instalacją npm, najpierw instaluje cel w
tymczasowym prefiksie npm, weryfikuje spakowany inwentarz `dist`, a następnie podmienia
czyste drzewo pakietu do rzeczywistego prefiksu globalnego. Dzięki temu npm nie nakłada
nowego pakietu na przestarzałe pliki ze starego pakietu. Jeśli polecenie instalacji się nie powiedzie,
OpenClaw ponawia próbę raz z `--omit=optional`. Ta ponowna próba pomaga hostom, na których natywne
opcjonalne zależności nie mogą się skompilować, jednocześnie zachowując widoczność pierwotnego błędu,
jeśli ścieżka awaryjna również się nie powiedzie.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Zaawansowane tematy instalacji npm

<AccordionGroup>
  <Accordion title="Drzewo pakietu tylko do odczytu">
    OpenClaw traktuje spakowane instalacje globalne jako tylko do odczytu w czasie działania, nawet gdy globalny katalog pakietu jest zapisywalny przez bieżącego użytkownika. Instalacje pakietów Plugin znajdują się w korzeniach npm/git należących do OpenClaw pod katalogiem konfiguracji użytkownika, a uruchomienie Gateway nie modyfikuje drzewa pakietu OpenClaw.

    Niektóre konfiguracje npm w Linux instalują pakiety globalne w katalogach należących do roota, takich jak `/usr/lib/node_modules/openclaw`. OpenClaw obsługuje taki układ, ponieważ polecenia instalacji/aktualizacji Plugin zapisują poza tym globalnym katalogiem pakietu.

  </Accordion>
  <Accordion title="Wzmocnione jednostki systemd">
    Przyznaj OpenClaw dostęp zapisu do jego korzeni konfiguracji/stanu, aby jawne instalacje Plugin, aktualizacje Plugin i czyszczenie doctor mogły utrwalić swoje zmiany:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Wstępne sprawdzanie miejsca na dysku">
    Przed aktualizacjami pakietów i jawnymi instalacjami Plugin OpenClaw próbuje wykonać best-effort sprawdzenie miejsca na dysku dla woluminu docelowego. Mała ilość miejsca generuje ostrzeżenie ze sprawdzoną ścieżką, ale nie blokuje aktualizacji, ponieważ limity systemu plików, migawki i woluminy sieciowe mogą zmienić się po sprawdzeniu. Rzeczywista instalacja menedżera pakietów i weryfikacja poinstalacyjna pozostają autorytatywne.
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
| -------- | --------------------------------------------------------------------------------------------------------------- |
| `stable` | Czeka `stableDelayHours`, a następnie stosuje z deterministycznym jitterem w zakresie `stableJitterHours` (rozłożone wdrożenie). |
| `beta`   | Sprawdza co `betaCheckIntervalHours` (domyślnie: co godzinę) i stosuje natychmiast.                              |
| `dev`    | Brak automatycznego zastosowania. Użyj ręcznie `openclaw update`.                                                |

Gateway zapisuje też w logach wskazówkę aktualizacji przy starcie (wyłącz przez `update.checkOnStart: false`).
W celu obniżenia wersji lub odzyskiwania po incydencie ustaw `OPENCLAW_NO_AUTO_UPDATE=1` w środowisku Gateway, aby zablokować automatyczne zastosowania nawet wtedy, gdy skonfigurowano `update.auto.enabled`. Wskazówki aktualizacji przy starcie mogą nadal działać, chyba że wyłączono także `update.checkOnStart`.

Aktualizacje menedżera pakietów żądane przez aktywny handler płaszczyzny kontrolnej Gateway
wymuszają nieodroczony restart aktualizacji bez okresu cooldown po podmianie pakietu. To
pozwala uniknąć pozostawienia starego procesu w pamięci na tyle długo, by leniwie ładował fragmenty
z drzewa pakietu, które zostało już zastąpione. Powłokowe `openclaw update`
pozostaje preferowaną ścieżką dla instalacji nadzorowanych, ponieważ może zatrzymać i
zrestartować usługę wokół aktualizacji.

## Po aktualizacji

<Steps>

### Uruchom doctor

```bash
openclaw doctor
```

Migruje konfigurację, audytuje zasady DM i sprawdza kondycję Gateway. Szczegóły: [Doctor](/pl/gateway/doctor)

### Zrestartuj Gateway

```bash
openclaw gateway restart
```

### Zweryfikuj

```bash
openclaw health
```

</Steps>

## Wycofanie

### Przypięcie wersji (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` pokazuje bieżącą opublikowaną wersję.
</Tip>

### Przypięcie commita (źródło)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Aby wrócić do najnowszej wersji: `git checkout main && git pull`.

## Jeśli utkniesz

- Uruchom ponownie `openclaw doctor` i uważnie przeczytaj wynik.
- W przypadku `openclaw update --channel dev` na checkoutach źródłowych aktualizator automatycznie bootstrapuje `pnpm`, gdy jest to potrzebne. Jeśli zobaczysz błąd bootstrapu pnpm/corepack, zainstaluj `pnpm` ręcznie (lub ponownie włącz `corepack`) i uruchom aktualizację ponownie.
- Sprawdź: [Rozwiązywanie problemów](/pl/gateway/troubleshooting)
- Zapytaj na Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Powiązane

- [Omówienie instalacji](/pl/install): wszystkie metody instalacji.
- [Doctor](/pl/gateway/doctor): kontrole kondycji po aktualizacjach.
- [Migracja](/pl/install/migrating): przewodniki migracji wersji głównych.
