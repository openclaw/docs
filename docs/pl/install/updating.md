---
read_when:
    - Aktualizowanie OpenClaw
    - Coś przestaje działać po aktualizacji
summary: Bezpieczne aktualizowanie OpenClaw (instalacja globalna lub ze źródeł) oraz strategia wycofywania
title: Aktualizacja
x-i18n:
    generated_at: "2026-04-30T10:02:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 17d4839002b153976e014e0eefcb44f92dcb9bb45b81bf30efb1e8e8c0f30ec3
    source_path: install/updating.md
    workflow: 16
---

Dbaj o aktualność OpenClaw.

## Zalecane: `openclaw update`

Najszybszy sposób aktualizacji. Wykrywa typ instalacji (npm albo git), pobiera najnowszą wersję, uruchamia `openclaw doctor` i ponownie uruchamia Gateway.

```bash
openclaw update
```

Aby przełączyć kanały albo wskazać konkretną wersję:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # podgląd bez stosowania zmian
```

`--channel beta` preferuje wersję beta, ale środowisko runtime wraca do stable/latest, gdy tag beta jest brakujący albo starszy niż najnowsze wydanie stabilne. Użyj `--tag beta`, jeśli chcesz surowego tagu dist-tag npm beta dla jednorazowej aktualizacji pakietu.

Zobacz [Kanały rozwojowe](/pl/install/development-channels), aby poznać semantykę kanałów.

## Przełączanie między instalacjami npm i git

Używaj kanałów, gdy chcesz zmienić typ instalacji. Aktualizator zachowuje Twój stan, konfigurację, dane uwierzytelniające i przestrzeń roboczą w `~/.openclaw`; zmienia tylko to, z której instalacji kodu OpenClaw korzystają CLI i Gateway.

```bash
# instalacja pakietu npm -> edytowalny checkout git
openclaw update --channel dev

# checkout git -> instalacja pakietu npm
openclaw update --channel stable
```

Najpierw uruchom z `--dry-run`, aby podejrzeć dokładne przełączenie trybu instalacji:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Kanał `dev` zapewnia checkout git, buduje go i instaluje globalne CLI z tego checkoutu. Kanały `stable` i `beta` używają instalacji pakietowych. Jeśli Gateway jest już zainstalowany, `openclaw update` odświeża metadane usługi i uruchamia ją ponownie, chyba że przekażesz `--no-restart`.

## Alternatywa: ponownie uruchom instalator

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Dodaj `--no-onboard`, aby pominąć wdrażanie. Aby wymusić konkretny typ instalacji przez instalator, przekaż `--install-method git --no-onboard` albo `--install-method npm --no-onboard`.

Jeśli `openclaw update` zawiedzie po fazie instalacji pakietu npm, ponownie uruchom instalator. Instalator nie wywołuje starego aktualizatora; uruchamia bezpośrednio globalną instalację pakietu i może odzyskać częściowo zaktualizowaną instalację npm.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Aby przypiąć odzyskiwanie do konkretnej wersji albo tagu dist-tag, dodaj `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternatywa: ręcznie przez npm, pnpm albo bun

```bash
npm i -g openclaw@latest
```

Gdy `openclaw update` zarządza globalną instalacją npm, najpierw instaluje cel w tymczasowym prefiksie npm, weryfikuje spis spakowanego `dist`, a następnie podmienia czyste drzewo pakietu do prawdziwego prefiksu globalnego. Zapobiega to nakładaniu przez npm nowego pakietu na przestarzałe pliki ze starego pakietu. Jeśli polecenie instalacji zawiedzie, OpenClaw ponawia próbę raz z `--omit=optional`. Ta ponowna próba pomaga hostom, na których natywne zależności opcjonalne nie mogą się skompilować, jednocześnie zachowując widoczność pierwotnego błędu, jeśli obejście także zawiedzie.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Zaawansowane tematy instalacji npm

<AccordionGroup>
  <Accordion title="Drzewo pakietów tylko do odczytu">
    OpenClaw traktuje spakowane globalne instalacje jako tylko do odczytu w czasie runtime, nawet gdy globalny katalog pakietu jest zapisywalny przez bieżącego użytkownika. Zależności runtime dołączonych Pluginów są umieszczane w zapisywalnym katalogu runtime zamiast modyfikować drzewo pakietu. Dzięki temu `openclaw update` nie ściga się z działającym Gateway ani lokalnym agentem, który naprawia zależności Pluginów podczas tej samej instalacji.

    Niektóre konfiguracje npm w Linuksie instalują pakiety globalne w katalogach należących do root, takich jak `/usr/lib/node_modules/openclaw`. OpenClaw obsługuje taki układ przez tę samą zewnętrzną ścieżkę stagingu.

  </Accordion>
  <Accordion title="Utwardzone jednostki systemd">
    Ustaw zapisywalny katalog stagingu, który jest uwzględniony w `ReadWritePaths`:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    `OPENCLAW_PLUGIN_STAGE_DIR` przyjmuje także listę ścieżek. OpenClaw rozwiązuje zależności runtime dołączonych Pluginów od lewej do prawej po wymienionych katalogach głównych, traktuje wcześniejsze katalogi główne jako tylko do odczytu, wstępnie zainstalowane warstwy, i instaluje albo naprawia wyłącznie w końcowym zapisywalnym katalogu głównym:

    ```ini
    Environment=OPENCLAW_PLUGIN_STAGE_DIR=/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

    Jeśli `OPENCLAW_PLUGIN_STAGE_DIR` nie jest ustawione, OpenClaw używa `$STATE_DIRECTORY`, gdy systemd je udostępnia, a następnie wraca do `~/.openclaw/plugin-runtime-deps`. Krok naprawy traktuje ten staging jako lokalny katalog główny pakietów należący do OpenClaw i ignoruje prefiks npm użytkownika oraz ustawienia globalne, więc konfiguracja npm dla instalacji globalnej nie przekierowuje zależności dołączonych Pluginów do `~/node_modules` ani do globalnego drzewa pakietu.

  </Accordion>
  <Accordion title="Wstępne sprawdzenie miejsca na dysku">
    Przed aktualizacjami pakietów i naprawami dołączonych zależności runtime OpenClaw próbuje wykonać najlepsze możliwe sprawdzenie miejsca na dysku dla woluminu docelowego. Mała ilość miejsca generuje ostrzeżenie ze sprawdzoną ścieżką, ale nie blokuje aktualizacji, ponieważ limity systemu plików, migawki i woluminy sieciowe mogą zmienić się po sprawdzeniu. Rzeczywista instalacja npm, kopiowanie i weryfikacja po instalacji pozostają rozstrzygające.
  </Accordion>
  <Accordion title="Zależności runtime dołączonych Pluginów">
    Instalacje pakietowe utrzymują zależności runtime dołączonych Pluginów poza drzewem pakietu tylko do odczytu. Przy uruchomieniu i podczas `openclaw doctor --fix` OpenClaw naprawia zależności runtime tylko dla dołączonych Pluginów, które są aktywne w konfiguracji, aktywne przez starszą konfigurację kanału albo włączone przez domyślne ustawienie ich dołączonego manifestu. Sam utrwalony stan uwierzytelnienia kanału nie wyzwala naprawy zależności runtime podczas startu Gateway.

    Jawne wyłączenie ma pierwszeństwo. Wyłączony Plugin albo kanał nie ma naprawianych zależności runtime tylko dlatego, że istnieje w pakiecie. Zewnętrzne Pluginy i niestandardowe ścieżki ładowania nadal używają `openclaw plugins install` albo `openclaw plugins update`.

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

| Kanał    | Zachowanie                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `stable` | Czeka `stableDelayHours`, a potem stosuje aktualizację z deterministycznym jitterem w ramach `stableJitterHours` (rozproszone wdrożenie). |
| `beta`   | Sprawdza co `betaCheckIntervalHours` (domyślnie: co godzinę) i stosuje natychmiast.                                            |
| `dev`    | Brak automatycznego stosowania. Użyj ręcznie `openclaw update`.                                                                |

Gateway zapisuje także podpowiedź o aktualizacji przy uruchomieniu (wyłącz przez `update.checkOnStart: false`).
W przypadku downgrade'u albo odzyskiwania po incydencie ustaw `OPENCLAW_NO_AUTO_UPDATE=1` w środowisku Gateway, aby zablokować automatyczne stosowanie aktualizacji nawet wtedy, gdy skonfigurowano `update.auto.enabled`. Podpowiedzi o aktualizacji przy starcie nadal mogą działać, chyba że wyłączono także `update.checkOnStart`.

## Po aktualizacji

<Steps>

### Uruchom doctor

```bash
openclaw doctor
```

Migruje konfigurację, audytuje zasady DM i sprawdza kondycję Gateway. Szczegóły: [Doctor](/pl/gateway/doctor)

### Uruchom ponownie Gateway

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
- Dla `openclaw update --channel dev` na checkoutach źródłowych aktualizator automatycznie bootstrapuje `pnpm`, gdy jest to potrzebne. Jeśli zobaczysz błąd bootstrapu pnpm/corepack, zainstaluj `pnpm` ręcznie (albo ponownie włącz `corepack`) i ponów aktualizację.
- Sprawdź: [Rozwiązywanie problemów](/pl/gateway/troubleshooting)
- Zapytaj na Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Powiązane

- [Przegląd instalacji](/pl/install): wszystkie metody instalacji.
- [Doctor](/pl/gateway/doctor): kontrole kondycji po aktualizacjach.
- [Migracja](/pl/install/migrating): przewodniki migracji wersji głównych.
