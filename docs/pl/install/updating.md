---
read_when:
    - Aktualizowanie OpenClaw
    - Coś przestaje działać po aktualizacji
summary: Bezpieczna aktualizacja OpenClaw (instalacja globalna lub ze źródeł) oraz strategia wycofywania zmian
title: Aktualizacja
x-i18n:
    generated_at: "2026-05-07T01:53:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 520f30980c56b9bcfc78bb2e916df812b2770a88c663140eeee3e9697bf58ee6
    source_path: install/updating.md
    workflow: 16
---

Utrzymuj OpenClaw na bieżąco.

## Zalecane: `openclaw update`

Najszybszy sposób aktualizacji. Wykrywa typ instalacji (npm albo git), pobiera najnowszą wersję, uruchamia `openclaw doctor` i restartuje Gateway.

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

`openclaw update` nie akceptuje `--verbose`. Do diagnostyki aktualizacji użyj
`--dry-run`, aby podejrzeć zaplanowane działania, `--json` dla wyników strukturalnych albo
`openclaw update status --json`, aby sprawdzić kanał i stan dostępności. Instalator
ma własną flagę `--verbose`, ale ta flaga nie jest częścią
`openclaw update`.

`--channel beta` preferuje wersję beta, ale runtime wraca do stable/latest, gdy
tag beta jest niedostępny albo starszy niż najnowsze wydanie stabilne. Użyj `--tag beta`,
jeśli chcesz surowy npm dist-tag beta dla jednorazowej aktualizacji pakietu.

OpenClaw nie udostępnia jeszcze kanału aktualizacji wsparcia LTS ani miesięcznego. Pracujemy
nad miesięcznymi liniami wsparcia zgodnymi z SemVer, ale obecnie obsługiwane
kanały to nadal `stable`, `beta` i `dev`.

Zobacz [Kanały deweloperskie](/pl/install/development-channels), aby poznać semantykę kanałów.

## Przełączanie między instalacjami npm i git

Używaj kanałów, gdy chcesz zmienić typ instalacji. Aktualizator zachowuje Twój
stan, konfigurację, dane uwierzytelniające i workspace w `~/.openclaw`; zmienia tylko
instalację kodu OpenClaw używaną przez CLI i Gateway.

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

## Alternatywa: uruchom ponownie instalator

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Dodaj `--no-onboard`, aby pominąć onboarding. Aby wymusić konkretny typ instalacji przez
instalator, przekaż `--install-method git --no-onboard` albo
`--install-method npm --no-onboard`.

Jeśli `openclaw update` zawiedzie po fazie instalacji pakietu npm, uruchom ponownie
instalator. Instalator nie wywołuje starego aktualizatora; uruchamia bezpośrednio
globalną instalację pakietu i może odzyskać częściowo zaktualizowaną instalację npm.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Aby przypiąć odzyskiwanie do konkretnej wersji albo dist-tag, dodaj `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternatywa: ręczne npm, pnpm albo bun

```bash
npm i -g openclaw@latest
```

Preferuj `openclaw update` dla instalacji nadzorowanych, ponieważ może skoordynować
podmianę pakietu z działającą usługą Gateway. Jeśli aktualizujesz ręcznie, gdy
zarządzany Gateway działa, zrestartuj Gateway natychmiast po zakończeniu działania
menedżera pakietów, aby stary proces nie obsługiwał dalej z podmienionych plików
pakietu.

Gdy `openclaw update` zarządza globalną instalacją npm, najpierw instaluje cel w
tymczasowym prefiksie npm, weryfikuje spis spakowanego `dist`, a potem zamienia
czyste drzewo pakietu z rzeczywistym globalnym prefiksem. Zapobiega to nakładaniu przez npm
nowego pakietu na nieaktualne pliki ze starego pakietu. Jeśli polecenie instalacji zawiedzie,
OpenClaw ponawia próbę raz z `--omit=optional`. Ta ponowna próba pomaga hostom, na których natywne
opcjonalne zależności nie mogą się skompilować, jednocześnie zachowując widoczność pierwotnej awarii,
jeśli fallback także zawiedzie.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Zaawansowane tematy instalacji npm

<AccordionGroup>
  <Accordion title="Read-only package tree">
    OpenClaw traktuje spakowane instalacje globalne jako tylko do odczytu w runtime, nawet gdy globalny katalog pakietu jest zapisywalny dla bieżącego użytkownika. Instalacje pakietów Plugin znajdują się w należących do OpenClaw korzeniach npm/git pod katalogiem konfiguracji użytkownika, a start Gateway nie modyfikuje drzewa pakietu OpenClaw.

    Niektóre konfiguracje npm w Linuksie instalują pakiety globalne w katalogach należących do roota, takich jak `/usr/lib/node_modules/openclaw`. OpenClaw obsługuje taki układ, ponieważ polecenia instalacji/aktualizacji Plugin zapisują poza tym globalnym katalogiem pakietu.

  </Accordion>
  <Accordion title="Hardened systemd units">
    Daj OpenClaw dostęp zapisu do jego korzeni konfiguracji/stanu, aby jawne instalacje Plugin, aktualizacje Plugin i czyszczenie przez doctor mogły utrwalać swoje zmiany:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Disk-space preflight">
    Przed aktualizacjami pakietów i jawnymi instalacjami Plugin OpenClaw próbuje wykonać najlepszym możliwym wysiłkiem sprawdzenie miejsca na dysku dla woluminu docelowego. Mała ilość miejsca powoduje ostrzeżenie ze sprawdzoną ścieżką, ale nie blokuje aktualizacji, ponieważ limity systemu plików, migawki i woluminy sieciowe mogą zmienić się po sprawdzeniu. Rzeczywista instalacja przez menedżer pakietów i weryfikacja po instalacji pozostają autorytatywne.
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
| `stable` | Czeka `stableDelayHours`, a potem stosuje z deterministycznym jitterem w obrębie `stableJitterHours` (rozłożone wdrożenie). |
| `beta`   | Sprawdza co `betaCheckIntervalHours` (domyślnie: co godzinę) i stosuje natychmiast.                              |
| `dev`    | Brak automatycznego stosowania. Użyj ręcznie `openclaw update`.                                                  |

Gateway rejestruje także wskazówkę aktualizacji przy starcie (wyłącz przez `update.checkOnStart: false`).
W przypadku downgrade'u albo odzyskiwania po incydencie ustaw `OPENCLAW_NO_AUTO_UPDATE=1` w środowisku Gateway, aby blokować automatyczne zastosowania nawet wtedy, gdy skonfigurowano `update.auto.enabled`. Wskazówki aktualizacji przy starcie nadal mogą działać, chyba że wyłączono także `update.checkOnStart`.

Aktualizacje menedżera pakietów żądane przez aktywny handler płaszczyzny sterowania Gateway
wymuszają niedeferowany restart aktualizacji bez cooldownu po podmianie pakietu. To
zapobiega pozostawieniu starego procesu w pamięci na tyle długo, by leniwie ładował fragmenty
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

### Przypnij wersję (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` pokazuje bieżącą opublikowaną wersję.
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

- Uruchom ponownie `openclaw doctor` i uważnie przeczytaj wynik.
- Dla `openclaw update --channel dev` na checkoutach źródłowych aktualizator automatycznie bootstrapuje `pnpm`, gdy jest to potrzebne. Jeśli zobaczysz błąd bootstrapu pnpm/corepack, zainstaluj `pnpm` ręcznie (albo włącz ponownie `corepack`) i uruchom aktualizację ponownie.
- Sprawdź: [Rozwiązywanie problemów](/pl/gateway/troubleshooting)
- Zapytaj na Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Powiązane

- [Omówienie instalacji](/pl/install): wszystkie metody instalacji.
- [Doctor](/pl/gateway/doctor): kontrole kondycji po aktualizacjach.
- [Migracja](/pl/install/migrating): przewodniki migracji wersji głównych.
