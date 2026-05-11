---
read_when:
    - Aktualizacja OpenClaw
    - Coś przestaje działać po aktualizacji
summary: Bezpieczne aktualizowanie OpenClaw (instalacja globalna lub z kodu źródłowego) oraz strategia wycofania
title: Aktualizowanie
x-i18n:
    generated_at: "2026-05-11T20:32:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: cb1506ed87b1cf2e4928987c9dbfaff17d47b87f6c18239d694e0f55deb609f7
    source_path: install/updating.md
    workflow: 16
---

Dbaj, aby OpenClaw był aktualny.

## Zalecane: `openclaw update`

Najszybszy sposób aktualizacji. Wykrywa typ instalacji (npm lub git), pobiera najnowszą wersję, uruchamia `openclaw doctor` i restartuje Gateway.

```bash
openclaw update
```

Aby przełączać kanały lub wskazać konkretną wersję:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`openclaw update` nie przyjmuje `--verbose`. Do diagnostyki aktualizacji użyj
`--dry-run`, aby podejrzeć planowane działania, `--json` dla wyników strukturalnych albo
`openclaw update status --json`, aby sprawdzić kanał i stan dostępności.
Instalator ma własną flagę `--verbose`, ale ta flaga nie jest częścią
`openclaw update`.

`--channel beta` preferuje wersję beta, ale środowisko uruchomieniowe wraca do stable/latest, gdy
tag beta jest niedostępny albo starszy niż najnowsze stabilne wydanie. Użyj `--tag beta`,
jeśli chcesz surowy npm beta dist-tag do jednorazowej aktualizacji pakietu.

W przypadku zarządzanych pluginów fallback kanału beta jest ostrzeżeniem: aktualizacja core może
nadal się powieść, podczas gdy plugin użyje swojego zapisanego domyślnego/najnowszego wydania, ponieważ nie jest dostępna
żadna beta pluginu.

Zobacz [Kanały deweloperskie](/pl/install/development-channels), aby poznać semantykę kanałów.

## Przełączanie między instalacjami npm i git

Używaj kanałów, gdy chcesz zmienić typ instalacji. Aktualizator zachowuje Twój
stan, konfigurację, poświadczenia i workspace w `~/.openclaw`; zmienia tylko to,
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

## Alternatywnie: ponownie uruchom instalator

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Dodaj `--no-onboard`, aby pominąć onboarding. Aby wymusić konkretny typ instalacji przez
instalator, przekaż `--install-method git --no-onboard` albo
`--install-method npm --no-onboard`.

Jeśli `openclaw update` nie powiedzie się po fazie instalacji pakietu npm, ponownie uruchom
instalator. Instalator nie wywołuje starego aktualizatora; uruchamia globalną
instalację pakietu bezpośrednio i może odzyskać częściowo zaktualizowaną instalację npm.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Aby przypiąć odzyskiwanie do konkretnej wersji lub dist-tag, dodaj `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternatywnie: ręcznie przez npm, pnpm lub bun

```bash
npm i -g openclaw@latest
```

Preferuj `openclaw update` dla instalacji nadzorowanych, ponieważ może koordynować
podmianę pakietu z działającą usługą Gateway. Jeśli aktualizujesz ręcznie, gdy
zarządzany Gateway działa, zrestartuj Gateway natychmiast po zakończeniu przez menedżera pakietów,
aby stary proces nie obsługiwał dalej z podmienionych plików pakietu.

Gdy `openclaw update` zarządza globalną instalacją npm, najpierw instaluje cel w
tymczasowym prefiksie npm, weryfikuje spakowany inwentarz `dist`, a następnie podmienia
czyste drzewo pakietu do rzeczywistego globalnego prefiksu. Zapobiega to nakładaniu przez npm
nowego pakietu na przestarzałe pliki ze starego pakietu. Jeśli polecenie instalacji się nie powiedzie,
OpenClaw ponawia próbę raz z `--omit=optional`. Ta próba pomaga hostom, na których natywne
opcjonalne zależności nie mogą się skompilować, jednocześnie zachowując widoczność pierwotnego błędu,
jeśli fallback również się nie powiedzie.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Zaawansowane tematy instalacji npm

<AccordionGroup>
  <Accordion title="Read-only package tree">
    OpenClaw traktuje spakowane instalacje globalne jako tylko do odczytu w czasie działania, nawet gdy globalny katalog pakietu jest zapisywalny dla bieżącego użytkownika. Instalacje pakietów Plugin znajdują się w należących do OpenClaw korzeniach npm/git pod katalogiem konfiguracji użytkownika, a uruchomienie Gateway nie modyfikuje drzewa pakietu OpenClaw.

    Niektóre konfiguracje npm w systemie Linux instalują pakiety globalne pod katalogami należącymi do root, takimi jak `/usr/lib/node_modules/openclaw`. OpenClaw obsługuje ten układ, ponieważ polecenia instalacji/aktualizacji pluginów zapisują poza tym globalnym katalogiem pakietu.

  </Accordion>
  <Accordion title="Hardened systemd units">
    Przyznaj OpenClaw dostęp do zapisu w jego korzeniach konfiguracji/stanu, aby jawne instalacje pluginów, aktualizacje pluginów i czyszczenie przez doctor mogły utrwalać swoje zmiany:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Disk-space preflight">
    Przed aktualizacjami pakietów i jawnymi instalacjami pluginów OpenClaw próbuje wykonać best-effort sprawdzenie miejsca na dysku dla woluminu docelowego. Mała ilość miejsca generuje ostrzeżenie ze sprawdzoną ścieżką, ale nie blokuje aktualizacji, ponieważ limity systemu plików, migawki i woluminy sieciowe mogą zmienić się po sprawdzeniu. Rzeczywista instalacja przez menedżera pakietów i weryfikacja poinstalacyjna pozostają autorytatywne.
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
| `stable` | Czeka `stableDelayHours`, a następnie stosuje z deterministycznym jitterem w ramach `stableJitterHours` (rozłożone wdrażanie). |
| `beta`   | Sprawdza co `betaCheckIntervalHours` (domyślnie: co godzinę) i stosuje natychmiast.                              |
| `dev`    | Brak automatycznego stosowania. Użyj `openclaw update` ręcznie.                                                  |

Gateway rejestruje też podpowiedź aktualizacji przy starcie (wyłącz przez `update.checkOnStart: false`).
W celu downgrade'u lub odzyskiwania po incydencie ustaw `OPENCLAW_NO_AUTO_UPDATE=1` w środowisku Gateway, aby zablokować automatyczne stosowanie nawet wtedy, gdy skonfigurowano `update.auto.enabled`. Podpowiedzi aktualizacji przy starcie nadal mogą działać, chyba że wyłączono też `update.checkOnStart`.

Aktualizacje przez menedżera pakietów żądane przez aktywny handler płaszczyzny sterowania Gateway
wymuszają restart aktualizacji bez odroczenia i bez cooldownu po podmianie pakietu. Pozwala to
uniknąć pozostawienia starego procesu w pamięci na tyle długo, by leniwie ładował fragmenty
z drzewa pakietu, które zostało już zastąpione. Powłokowe `openclaw update`
pozostaje preferowaną ścieżką dla instalacji nadzorowanych, ponieważ może zatrzymać i
ponownie uruchomić usługę wokół aktualizacji.

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

## Rollback

### Przypnij wersję (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` pokazuje aktualnie opublikowaną wersję.
</Tip>

### Przypnij commit (źródło)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Aby wrócić do najnowszej wersji: `git checkout main && git pull`.

## Jeśli utkniesz

- Ponownie uruchom `openclaw doctor` i uważnie przeczytaj wynik.
- W przypadku `openclaw update --channel dev` na checkoutach źródłowych aktualizator automatycznie bootstrapuje `pnpm`, gdy jest to potrzebne. Jeśli zobaczysz błąd bootstrapu pnpm/corepack, zainstaluj `pnpm` ręcznie (albo ponownie włącz `corepack`) i uruchom aktualizację ponownie.
- Sprawdź: [Rozwiązywanie problemów](/pl/gateway/troubleshooting)
- Zapytaj na Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Powiązane

- [Przegląd instalacji](/pl/install): wszystkie metody instalacji.
- [Doctor](/pl/gateway/doctor): kontrole kondycji po aktualizacjach.
- [Migracja](/pl/install/migrating): przewodniki migracji wersji głównych.
