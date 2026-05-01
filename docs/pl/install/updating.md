---
read_when:
    - Aktualizowanie OpenClaw
    - Coś się psuje po aktualizacji
summary: Bezpieczne aktualizowanie OpenClaw (instalacji globalnej lub ze źródeł) oraz strategia wycofania zmian
title: Aktualizacja
x-i18n:
    generated_at: "2026-05-01T09:59:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: b6ee340af569dde3a6cf61fff26d2a0ab8c8ec882b652f41d6ac8e22ddc5fed1
    source_path: install/updating.md
    workflow: 16
---

Dbaj o aktualność OpenClaw.

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

`--channel beta` preferuje wersję beta, ale środowisko uruchomieniowe wraca do stable/latest, gdy
brakuje tagu beta albo jest on starszy niż najnowsze stabilne wydanie. Użyj `--tag beta`,
jeśli chcesz użyć surowego npm beta dist-tag do jednorazowej aktualizacji pakietu.

Zobacz [Kanały programistyczne](/pl/install/development-channels), aby poznać semantykę kanałów.

## Przełączanie między instalacjami npm i git

Używaj kanałów, gdy chcesz zmienić typ instalacji. Aktualizator zachowuje Twój
stan, konfigurację, poświadczenia i obszar roboczy w `~/.openclaw`; zmienia tylko to,
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

Kanał `dev` zapewnia checkout git, buduje go i instaluje globalny CLI
z tego checkoutu. Kanały `stable` i `beta` używają instalacji pakietowych. Jeśli
Gateway jest już zainstalowany, `openclaw update` odświeża metadane usługi
i restartuje ją, chyba że przekażesz `--no-restart`.

## Alternatywa: ponowne uruchomienie instalatora

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Dodaj `--no-onboard`, aby pominąć onboarding. Aby wymusić konkretny typ instalacji przez
instalator, przekaż `--install-method git --no-onboard` albo
`--install-method npm --no-onboard`.

Jeśli `openclaw update` nie powiedzie się po fazie instalacji pakietu npm, uruchom
instalator ponownie. Instalator nie wywołuje starego aktualizatora; uruchamia globalną
instalację pakietu bezpośrednio i może naprawić częściowo zaktualizowaną instalację npm.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Aby przypiąć odzyskiwanie do konkretnej wersji lub dist-tag, dodaj `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternatywa: ręcznie przez npm, pnpm lub bun

```bash
npm i -g openclaw@latest
```

Gdy `openclaw update` zarządza globalną instalacją npm, najpierw instaluje cel w
tymczasowym prefiksie npm, weryfikuje spis spakowanego `dist`, a potem podmienia
czyste drzewo pakietu do rzeczywistego globalnego prefiksu. Dzięki temu npm nie nakłada
nowego pakietu na przestarzałe pliki ze starego pakietu. Jeśli polecenie instalacji się nie powiedzie,
OpenClaw ponawia próbę raz z `--omit=optional`. Ta ponowna próba pomaga hostom, na których natywne
opcjonalne zależności nie mogą się skompilować, jednocześnie zachowując widoczność pierwotnego błędu,
jeśli rozwiązanie awaryjne także się nie powiedzie.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Zaawansowane tematy instalacji npm

<AccordionGroup>
  <Accordion title="Drzewo pakietów tylko do odczytu">
    OpenClaw traktuje spakowane globalne instalacje jako tylko do odczytu w czasie działania, nawet gdy globalny katalog pakietu jest zapisywalny przez bieżącego użytkownika. Dołączone zależności środowiska uruchomieniowego Pluginów są przygotowywane w zapisywalnym katalogu środowiska uruchomieniowego zamiast modyfikować drzewo pakietu. Dzięki temu `openclaw update` nie konkuruje z działającym Gateway ani lokalnym agentem naprawiającym zależności Pluginów podczas tej samej instalacji.

    Niektóre konfiguracje npm w systemie Linux instalują globalne pakiety w katalogach należących do roota, takich jak `/usr/lib/node_modules/openclaw`. OpenClaw obsługuje taki układ przez tę samą zewnętrzną ścieżkę przygotowawczą.

  </Accordion>
  <Accordion title="Wzmocnione jednostki systemd">
    Ustaw zapisywalny katalog przygotowawczy uwzględniony w `ReadWritePaths`:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` akceptuje także listę ścieżek. OpenClaw rozwiązuje dołączone zależności środowiska uruchomieniowego Pluginów od lewej do prawej w podanych katalogach głównych, traktuje wcześniejsze katalogi jako preinstalowane warstwy tylko do odczytu i instaluje lub naprawia tylko w końcowym zapisywalnym katalogu głównym:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    Jeśli `OPENCLAW_PLUGIN_STAGE_DIR` nie jest ustawione, OpenClaw używa `$STATE_DIRECTORY`, gdy zapewnia je systemd, a następnie wraca do `~/.openclaw/plugin-runtime-deps`. Krok naprawy traktuje ten obszar przygotowawczy jako lokalny katalog główny pakietów należący do OpenClaw i ignoruje prefiks npm użytkownika oraz ustawienia globalne, więc konfiguracja npm dla instalacji globalnej nie przekierowuje dołączonych zależności Pluginów do `~/node_modules` ani do globalnego drzewa pakietu.

  </Accordion>
  <Accordion title="Wstępne sprawdzenie miejsca na dysku">
    Przed aktualizacjami pakietów i naprawami dołączonych zależności środowiska uruchomieniowego OpenClaw próbuje wykonać orientacyjne sprawdzenie miejsca na dysku dla woluminu docelowego. Mała ilość miejsca generuje ostrzeżenie ze sprawdzoną ścieżką, ale nie blokuje aktualizacji, ponieważ limity systemu plików, migawki i woluminy sieciowe mogą się zmienić po sprawdzeniu. Rzeczywista instalacja npm, kopiowanie i weryfikacja po instalacji pozostają rozstrzygające.
  </Accordion>
  <Accordion title="Dołączone zależności środowiska uruchomieniowego Pluginów">
    Instalacje pakietowe trzymają dołączone zależności środowiska uruchomieniowego Pluginów poza drzewem pakietu tylko do odczytu. Podczas uruchamiania i w trakcie `openclaw doctor --fix` OpenClaw naprawia zależności środowiska uruchomieniowego tylko dla dołączonych Pluginów, które są aktywne w konfiguracji, aktywne przez starszą konfigurację kanału albo włączone przez domyślne ustawienie dołączonego manifestu. Sam utrwalony stan uwierzytelniania kanału nie uruchamia naprawy zależności środowiska uruchomieniowego przy starcie Gateway.

    Jawne wyłączenie ma pierwszeństwo. Wyłączony Plugin lub kanał nie ma naprawianych zależności środowiska uruchomieniowego tylko dlatego, że istnieje w pakiecie. Zewnętrzne Pluginy i niestandardowe ścieżki ładowania nadal używają `openclaw plugins install` albo `openclaw plugins update`.

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
| `stable` | Czeka `stableDelayHours`, a następnie stosuje z deterministycznym jitterem w ramach `stableJitterHours` (rozproszony rollout). |
| `beta`   | Sprawdza co `betaCheckIntervalHours` (domyślnie: co godzinę) i stosuje natychmiast.                              |
| `dev`    | Brak automatycznego stosowania. Użyj ręcznie `openclaw update`.                                                   |

Gateway zapisuje także wskazówkę aktualizacji przy starcie (wyłącz przez `update.checkOnStart: false`).
W przypadku downgrade'u lub odzyskiwania po incydencie ustaw `OPENCLAW_NO_AUTO_UPDATE=1` w środowisku Gateway, aby zablokować automatyczne stosowanie nawet wtedy, gdy skonfigurowano `update.auto.enabled`. Wskazówki aktualizacji przy starcie nadal mogą działać, chyba że wyłączono także `update.checkOnStart`.

Aktualizacje menedżera pakietów żądane przez aktywny handler płaszczyzny sterowania Gateway
wymuszają niezależny od odroczenia i cooldownu restart aktualizacji po podmianie pakietu. Dzięki temu
stary proces w pamięci nie pozostaje wystarczająco długo, aby leniwie ładować fragmenty
z drzewa pakietu, które zostało już zastąpione. Powłokowe `openclaw update`
pozostaje preferowaną ścieżką dla nadzorowanych instalacji, ponieważ może zatrzymać i
zrestartować usługę wokół aktualizacji.

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

### Przypnij commit (źródła)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Aby wrócić do najnowszej wersji: `git checkout main && git pull`.

## Jeśli utkniesz

- Uruchom ponownie `openclaw doctor` i uważnie przeczytaj wynik.
- Dla `openclaw update --channel dev` na checkoutach źródłowych aktualizator automatycznie bootstrapuje `pnpm`, gdy jest to potrzebne. Jeśli zobaczysz błąd bootstrapu pnpm/corepack, zainstaluj `pnpm` ręcznie (albo ponownie włącz `corepack`) i ponownie uruchom aktualizację.
- Sprawdź: [Rozwiązywanie problemów](/pl/gateway/troubleshooting)
- Zapytaj na Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Powiązane

- [Przegląd instalacji](/pl/install): wszystkie metody instalacji.
- [Doctor](/pl/gateway/doctor): kontrole kondycji po aktualizacjach.
- [Migracja](/pl/install/migrating): przewodniki po migracji głównych wersji.
