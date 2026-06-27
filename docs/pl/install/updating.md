---
read_when:
    - Aktualizowanie OpenClaw
    - Coś przestaje działać po aktualizacji
summary: Bezpieczne aktualizowanie OpenClaw (instalacja globalna lub ze źródeł) oraz strategia wycofania
title: Aktualizowanie
x-i18n:
    generated_at: "2026-06-27T17:44:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a96c5b9b12040fe9bb8b1623c88a9c305d58dc6fcee7003f500e897ded9e7b4a
    source_path: install/updating.md
    workflow: 16
---

Utrzymuj OpenClaw w aktualnej wersji.

## Zalecane: `openclaw update`

Najszybszy sposób aktualizacji. Wykrywa typ instalacji (npm albo git), pobiera najnowszą wersję, uruchamia `openclaw doctor` i restartuje Gateway.

```bash
openclaw update
```

Aby przełączyć kanały albo wskazać konkretną wersję:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --dry-run   # preview without applying
```

`openclaw update` nie przyjmuje `--verbose`. Do diagnostyki aktualizacji użyj
`--dry-run`, aby podejrzeć planowane działania, `--json` dla wyników strukturalnych albo
`openclaw update status --json`, aby sprawdzić stan kanału i dostępności. Instalator
ma własną flagę `--verbose`, ale ta flaga nie jest częścią
`openclaw update`.

`--channel beta` preferuje wersję beta, ale środowisko uruchomieniowe wraca do stable/latest, gdy
tag beta jest niedostępny albo starszy niż najnowsze wydanie stable. Użyj `--tag beta`,
jeśli chcesz użyć surowego npm dist-tag beta do jednorazowej aktualizacji pakietu.

Użyj `--channel dev` dla trwałego, ruchomego checkoutu GitHub `main`. Dla aktualizacji pakietów
`--tag main` mapuje się na `github:openclaw/openclaw#main` dla jednego uruchomienia, a
specyfikacje źródeł GitHub/git są pakowane do tymczasowego archiwum tar przed etapową
instalacją npm.

Dla zarządzanych pluginów fallback kanału beta jest ostrzeżeniem: aktualizacja rdzenia może
nadal się powieść, podczas gdy Plugin użyje zapisanego domyślnego/najnowszego wydania, ponieważ
nie ma dostępnej wersji beta tego pluginu.

Zobacz [Kanały deweloperskie](/pl/install/development-channels), aby poznać semantykę kanałów.

## Przełączanie między instalacjami npm i git

Używaj kanałów, gdy chcesz zmienić typ instalacji. Aktualizator zachowuje Twój
stan, konfigurację, dane logowania i workspace w `~/.openclaw`; zmienia tylko to,
z której instalacji kodu OpenClaw korzystają CLI i Gateway.

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

Dla instalacji pakietowych z zarządzaną usługą Gateway `openclaw update` celuje
w katalog główny pakietu używany przez tę usługę. Jeśli polecenie powłoki `openclaw`
pochodzi z innej instalacji, aktualizator wypisuje oba katalogi główne i ścieżkę Node
zarządzanej usługi. Aktualizacja pakietu używa menedżera pakietów, który jest właścicielem
katalogu głównego usługi, i sprawdza Node zarządzanej usługi względem silnika docelowego wydania
przed zastąpieniem pakietu.

## Alternatywa: ponowne uruchomienie instalatora

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Dodaj `--no-onboard`, aby pominąć onboarding. Aby wymusić konkretny typ instalacji przez
instalator, przekaż `--install-method git --no-onboard` albo
`--install-method npm --no-onboard`.

Jeśli `openclaw update` nie powiedzie się po fazie instalacji pakietu npm, uruchom ponownie
instalator. Instalator nie wywołuje starego aktualizatora; uruchamia globalną
instalację pakietu bezpośrednio i może naprawić częściowo zaktualizowaną instalację npm.

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

Preferuj `openclaw update` dla nadzorowanych instalacji, ponieważ może skoordynować
podmianę pakietu z działającą usługą Gateway. Jeśli aktualizujesz ręcznie instalację
nadzorowaną, zatrzymaj zarządzany Gateway przed uruchomieniem menedżera pakietów.
Menedżery pakietów zastępują pliki w miejscu, a działający Gateway może w przeciwnym razie próbować
ładować pliki rdzenia albo pluginu, gdy drzewo pakietu jest tymczasowo podmienione tylko częściowo.
Po zakończeniu pracy menedżera pakietów zrestartuj Gateway, aby usługa użyła
nowej instalacji.

Dla systemowej globalnej instalacji Linuksa należącej do root, jeśli `openclaw update` kończy się błędem
`EACCES` i odzyskujesz ją za pomocą systemowego npm, pozostaw Gateway zatrzymany podczas
ręcznej wymiany pakietu. Użyj tych samych flag profilu `openclaw` albo środowiska,
których zwykle używasz dla tego Gateway. Zastąp `/usr/bin/npm` systemowym npm,
który jest właścicielem globalnego prefiksu należącego do root na Twoim hoście:

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

Następnie zweryfikuj usługę:

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

Gdy `openclaw update` zarządza globalną instalacją npm, najpierw instaluje cel
do tymczasowego prefiksu npm, weryfikuje spis zapakowanego `dist`, a następnie podmienia
czyste drzewo pakietu do rzeczywistego globalnego prefiksu. Zapobiega to nakładaniu przez npm
nowego pakietu na nieaktualne pliki ze starego pakietu. Jeśli polecenie instalacji się nie powiedzie,
OpenClaw ponawia próbę raz z `--omit=optional`. Ta ponowna próba pomaga hostom, na których natywne
zależności opcjonalne nie mogą się skompilować, jednocześnie zachowując widoczność pierwotnego błędu,
jeśli fallback również się nie powiedzie.

Zarządzane przez OpenClaw polecenia aktualizacji npm i aktualizacji pluginów czyszczą także kwarantannę npm
`min-release-age` dla podrzędnego procesu npm. npm może zgłosić tę
politykę jako pochodną granicę `before`; oba mechanizmy są przydatne dla ogólnych polityk
kwarantanny łańcucha dostaw, ale jawna aktualizacja OpenClaw oznacza „zainstaluj wybrane
wydanie OpenClaw teraz”.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Zaawansowane tematy instalacji npm

<AccordionGroup>
  <Accordion title="Read-only package tree">
    OpenClaw traktuje spakowane instalacje globalne jako tylko do odczytu w czasie działania, nawet gdy globalny katalog pakietu jest zapisywalny dla bieżącego użytkownika. Instalacje pakietów pluginów znajdują się w należących do OpenClaw katalogach głównych npm/git pod katalogiem konfiguracji użytkownika, a uruchamianie Gateway nie modyfikuje drzewa pakietu OpenClaw.

    Niektóre konfiguracje npm w Linuksie instalują globalne pakiety w katalogach należących do root, takich jak `/usr/lib/node_modules/openclaw`. OpenClaw obsługuje taki układ, ponieważ polecenia instalacji/aktualizacji pluginów zapisują poza tym globalnym katalogiem pakietu.

  </Accordion>
  <Accordion title="Hardened systemd units">
    Daj OpenClaw dostęp do zapisu w katalogach głównych konfiguracji/stanu, aby jawne instalacje pluginów, aktualizacje pluginów i czyszczenie przez doctor mogły utrwalać swoje zmiany:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Disk-space preflight">
    Przed aktualizacjami pakietów i jawnymi instalacjami pluginów OpenClaw próbuje wykonać best-effort sprawdzenie miejsca na dysku dla woluminu docelowego. Mała ilość miejsca generuje ostrzeżenie ze sprawdzoną ścieżką, ale nie blokuje aktualizacji, ponieważ limity systemu plików, snapshoty i woluminy sieciowe mogą zmienić się po sprawdzeniu. Rzeczywista instalacja przez menedżera pakietów i weryfikacja poinstalacyjna pozostają rozstrzygające.
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
| `stable` | Czeka `stableDelayHours`, a następnie stosuje z deterministycznym jitterem w ramach `stableJitterHours` (rozłożone wdrożenie). |
| `beta`   | Sprawdza co `betaCheckIntervalHours` (domyślnie: co godzinę) i stosuje natychmiast.                              |
| `dev`    | Brak automatycznego zastosowania. Użyj ręcznie `openclaw update`.                                                |

Gateway zapisuje też podpowiedź o aktualizacji przy starcie (wyłącz przez `update.checkOnStart: false`).
Do downgrade'u albo odzyskiwania po incydencie ustaw `OPENCLAW_NO_AUTO_UPDATE=1` w środowisku Gateway, aby blokować automatyczne zastosowania nawet wtedy, gdy skonfigurowano `update.auto.enabled`. Podpowiedzi aktualizacji przy starcie nadal mogą działać, chyba że `update.checkOnStart` także jest wyłączone.

Aktualizacje menedżera pakietów żądane przez działający handler płaszczyzny sterowania Gateway
nie zastępują drzewa pakietu wewnątrz działającego procesu Gateway. W instalacjach usługi zarządzanej
Gateway uruchamia odłączone przekazanie, wychodzi i pozwala normalnej ścieżce CLI
`openclaw update --yes --json` zatrzymać usługę, zastąpić pakiet,
odświeżyć metadane usługi, zrestartować, zweryfikować wersję i osiągalność Gateway oraz
odzyskać zainstalowany, ale niewczytany macOS LaunchAgent, gdy to możliwe. Jeśli Gateway nie może bezpiecznie wykonać takiego przekazania, `update.run` zgłasza
bezpieczne polecenie powłoki zamiast uruchamiać menedżera pakietów w procesie.

## Po aktualizacji

<Steps>

### Uruchom doctor

```bash
openclaw doctor
```

Migruje konfigurację, audytuje polityki DM i sprawdza kondycję Gateway. Szczegóły: [Doctor](/pl/gateway/doctor)

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
- Dla `openclaw update --channel dev` na checkoutach źródłowych aktualizator automatycznie bootstrapuje `pnpm`, gdy jest to potrzebne. Jeśli zobaczysz błąd bootstrapu pnpm/corepack, zainstaluj `pnpm` ręcznie (albo ponownie włącz `corepack`) i uruchom aktualizację ponownie.
- Sprawdź: [Rozwiązywanie problemów](/pl/gateway/troubleshooting)
- Zapytaj na Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Powiązane

- [Przegląd instalacji](/pl/install): wszystkie metody instalacji.
- [Doctor](/pl/gateway/doctor): kontrole kondycji po aktualizacjach.
- [Migracja](/pl/install/migrating): przewodniki po migracji wersji głównych.
