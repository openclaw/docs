---
read_when:
    - Aktualizowanie OpenClaw
    - Coś przestaje działać po aktualizacji
summary: Bezpieczne aktualizowanie OpenClaw (instalacja globalna lub ze źródeł) oraz strategia wycofywania zmian
title: Aktualizowanie
x-i18n:
    generated_at: "2026-05-02T09:55:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84bf4462a4ee041b0d22e433d1e9f44cfd799a5c327ba94f9df96595d92bdb3c
    source_path: install/updating.md
    workflow: 16
---

Aktualizuj OpenClaw na bieżąco.

## Zalecane: `openclaw update`

Najszybszy sposób aktualizacji. Wykrywa typ instalacji (npm lub git), pobiera najnowszą wersję, uruchamia `openclaw doctor` i restartuje gateway.

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

`--channel beta` preferuje wersję beta, ale środowisko uruchomieniowe wraca do stable/latest, gdy tag beta jest brakujący lub starszy niż najnowsze wydanie stabilne. Użyj `--tag beta`, jeśli chcesz surowy npm beta dist-tag do jednorazowej aktualizacji pakietu.

Zobacz [Kanały deweloperskie](/pl/install/development-channels), aby poznać semantykę kanałów.

## Przełączanie między instalacjami npm i git

Używaj kanałów, gdy chcesz zmienić typ instalacji. Aktualizator zachowuje stan, konfigurację, dane uwierzytelniające i obszar roboczy w `~/.openclaw`; zmienia tylko instalację kodu OpenClaw używaną przez CLI i gateway.

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

Kanał `dev` zapewnia checkout git, buduje go i instaluje globalne CLI z tego checkoutu. Kanały `stable` i `beta` używają instalacji pakietów. Jeśli gateway jest już zainstalowany, `openclaw update` odświeża metadane usługi i restartuje ją, chyba że przekażesz `--no-restart`.

## Alternatywa: ponowne uruchomienie instalatora

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Dodaj `--no-onboard`, aby pominąć wdrażanie. Aby wymusić konkretny typ instalacji przez instalator, przekaż `--install-method git --no-onboard` lub `--install-method npm --no-onboard`.

Jeśli `openclaw update` nie powiedzie się po fazie instalacji pakietu npm, uruchom instalator ponownie. Instalator nie wywołuje starego aktualizatora; uruchamia bezpośrednio globalną instalację pakietu i może odzyskać częściowo zaktualizowaną instalację npm.

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

Gdy `openclaw update` zarządza globalną instalacją npm, najpierw instaluje cel w tymczasowym prefiksie npm, weryfikuje spis zapakowanego `dist`, a następnie podmienia czyste drzewo pakietu do rzeczywistego globalnego prefiksu. Zapobiega to nakładaniu przez npm nowego pakietu na przestarzałe pliki ze starego pakietu. Jeśli polecenie instalacji się nie powiedzie, OpenClaw ponawia próbę raz z `--omit=optional`. Ta ponowna próba pomaga hostom, na których natywne opcjonalne zależności nie mogą się skompilować, a jednocześnie pozostawia pierwotny błąd widoczny, jeśli obejście również zawiedzie.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Zaawansowane tematy instalacji npm

<AccordionGroup>
  <Accordion title="Drzewo pakietów tylko do odczytu">
    OpenClaw traktuje zapakowane instalacje globalne jako tylko do odczytu w czasie działania, nawet gdy globalny katalog pakietu jest zapisywalny przez bieżącego użytkownika. Instalacje pakietów Plugin znajdują się w należących do OpenClaw korzeniach npm/git pod katalogiem konfiguracji użytkownika, a uruchomienie Gateway nie modyfikuje drzewa pakietu OpenClaw.

    Niektóre konfiguracje npm w Linuksie instalują pakiety globalne w katalogach należących do roota, takich jak `/usr/lib/node_modules/openclaw`. OpenClaw obsługuje taki układ, ponieważ polecenia instalacji/aktualizacji Plugin zapisują poza tym globalnym katalogiem pakietu.

  </Accordion>
  <Accordion title="Utwardzone jednostki systemd">
    Przyznaj OpenClaw dostęp do zapisu w korzeniach konfiguracji/stanu, aby jawne instalacje Plugin, aktualizacje Plugin i czyszczenie przez doctor mogły utrwalać swoje zmiany:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Wstępna kontrola miejsca na dysku">
    Przed aktualizacjami pakietów i jawnymi instalacjami Plugin OpenClaw podejmuje najlepszą możliwą próbę sprawdzenia miejsca na dysku dla woluminu docelowego. Mała ilość miejsca powoduje ostrzeżenie ze sprawdzoną ścieżką, ale nie blokuje aktualizacji, ponieważ limity systemu plików, migawki i woluminy sieciowe mogą zmienić się po kontroli. Rzeczywista instalacja przez menedżera pakietów i weryfikacja po instalacji pozostają rozstrzygające.
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
| `stable` | Czeka `stableDelayHours`, a potem stosuje z deterministycznym rozrzutem w `stableJitterHours` (rozłożone wdrożenie). |
| `beta`   | Sprawdza co `betaCheckIntervalHours` (domyślnie: co godzinę) i stosuje natychmiast.                             |
| `dev`    | Brak automatycznego stosowania. Użyj ręcznie `openclaw update`.                                                 |

Gateway zapisuje także wskazówkę aktualizacji przy starcie (wyłącz przez `update.checkOnStart: false`).
W przypadku obniżenia wersji lub odzyskiwania po incydencie ustaw `OPENCLAW_NO_AUTO_UPDATE=1` w środowisku Gateway, aby zablokować automatyczne stosowanie nawet wtedy, gdy skonfigurowano `update.auto.enabled`. Wskazówki aktualizacji przy starcie nadal mogą działać, chyba że `update.checkOnStart` również jest wyłączone.

Aktualizacje menedżera pakietów żądane przez aktywny handler płaszczyzny sterowania Gateway wymuszają restart aktualizacji bez odroczenia i bez okresu wyciszenia po podmianie pakietu. Zapobiega to pozostawieniu starego procesu w pamięci na tyle długo, by leniwie załadował fragmenty z drzewa pakietu, które zostało już zastąpione. Polecenie powłoki `openclaw update` pozostaje preferowaną ścieżką dla nadzorowanych instalacji, ponieważ może zatrzymać i zrestartować usługę wokół aktualizacji.

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
- Dla `openclaw update --channel dev` na checkoutach źródłowych aktualizator automatycznie bootstrapuje `pnpm`, gdy jest to potrzebne. Jeśli zobaczysz błąd bootstrapu pnpm/corepack, zainstaluj `pnpm` ręcznie (lub ponownie włącz `corepack`) i uruchom aktualizację ponownie.
- Sprawdź: [Rozwiązywanie problemów](/pl/gateway/troubleshooting)
- Zapytaj na Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Powiązane

- [Omówienie instalacji](/pl/install): wszystkie metody instalacji.
- [Doctor](/pl/gateway/doctor): kontrole kondycji po aktualizacjach.
- [Migracja](/pl/install/migrating): przewodniki migracji głównych wersji.
