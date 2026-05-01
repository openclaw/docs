---
read_when:
    - Debugujesz naprawę zależności środowiska uruchomieniowego dołączonego Plugin
    - Zmieniasz zachowanie uruchamiania Plugin, narzędzia doctor lub instalacji menedżera pakietów
    - Utrzymujesz spakowane instalacje OpenClaw lub dołączone manifesty Pluginów
sidebarTitle: Dependencies
summary: Jak OpenClaw planuje, przygotowuje i naprawia zależności środowiska uruchomieniowego dołączonych Pluginów
title: Rozwiązywanie zależności Pluginu
x-i18n:
    generated_at: "2026-05-01T10:01:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: e09245c2b7e2f1fb2a61d64f0f9dc77e7df7da58fd71608c391e3865345b7bc9
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw nie instaluje całego drzewa zależności każdej dołączonej wtyczki podczas instalacji pakietu. Najpierw wyprowadza efektywny plan wtyczek z konfiguracji i metadanych wtyczek, a następnie przygotowuje zależności uruchomieniowe tylko dla dołączonych wtyczek należących do OpenClaw, które plan może faktycznie załadować.

Ta strona opisuje spakowane zależności uruchomieniowe dołączonych wtyczek OpenClaw. Wtyczki firm trzecich i niestandardowe ścieżki wtyczek nadal używają jawnych poleceń instalacji wtyczek, takich jak `openclaw plugins install` i `openclaw plugins update`.

## Podział odpowiedzialności

OpenClaw odpowiada za plan i zasady:

- które wtyczki są aktywne dla tej konfiguracji
- które katalogi główne zależności są zapisywalne lub tylko do odczytu
- kiedy naprawa jest dozwolona
- które identyfikatory wtyczek są przygotowywane do uruchomienia
- końcowe kontrole przed importem modułów uruchomieniowych wtyczek

Menedżer pakietów odpowiada za zbieżność zależności:

- rozwiązywanie grafu pakietów
- obsługę zależności produkcyjnych, opcjonalnych i równorzędnych
- układ `node_modules`
- integralność pakietów
- metadane blokady i instalacji

W praktyce OpenClaw powinien zdecydować, co musi istnieć. `pnpm` lub `npm` powinny sprawić, aby system plików odpowiadał tej decyzji.

OpenClaw odpowiada również za blokadę koordynacji dla każdego katalogu głównego instalacji. Menedżery pakietów chronią własną transakcję instalacji, ale nie serializują zapisów manifestu OpenClaw, kopiowania/zmiany nazwy izolowanego etapu, końcowej walidacji ani importu wtyczki względem innego procesu Gateway, doctor lub CLI dotykającego tego samego katalogu głównego zależności uruchomieniowych.

## Efektywny plan wtyczek

Efektywny plan wtyczek jest wyprowadzany z konfiguracji oraz wykrytych metadanych wtyczek. Te dane wejściowe mogą aktywować zależności uruchomieniowe dołączonych wtyczek:

- `plugins.entries.<id>.enabled`
- `plugins.allow`, `plugins.deny` i `plugins.enabled`
- starsza konfiguracja kanału, taka jak `channels.telegram.enabled`
- skonfigurowani dostawcy, modele lub odwołania do zaplecza CLI, które wymagają wtyczki
- domyślne wartości dołączonego manifestu, takie jak `enabledByDefault`
- indeks zainstalowanych wtyczek i metadane dołączonego manifestu

Jawne wyłączenie ma pierwszeństwo. Wyłączona wtyczka, odrzucony identyfikator wtyczki, wyłączony system wtyczek lub wyłączony kanał nie uruchamiają naprawy zależności uruchomieniowych. Sam utrwalony stan uwierzytelniania również nie aktywuje dołączonego kanału ani dostawcy.

Plan wtyczek jest stabilnym wejściem. Wygenerowana materializacja zależności jest wyjściem tego planu.

## Przepływ uruchamiania

Uruchomienie Gateway analizuje konfigurację i buduje tabelę wyszukiwania wtyczek startowych przed załadowaniem modułów uruchomieniowych wtyczek. Następnie uruchomienie przygotowuje zależności uruchomieniowe tylko dla `startupPluginIds` wybranych przez ten plan.

W instalacjach pakietowych przygotowanie zależności jest dozwolone przed importem wtyczek. Po przygotowaniu loader środowiska uruchomieniowego importuje wtyczki startowe z wyłączoną naprawą instalacji; w tym momencie brak materializacji zależności jest traktowany jako błąd ładowania, a nie kolejna pętla naprawy.

Gdy przygotowanie zależności startowych jest odroczone do czasu po powiązaniu HTTP, gotowość Gateway pozostaje zablokowana z powodu `plugin-runtime-deps`, dopóki zależności wybranych wtyczek startowych nie zostaną zmaterializowane, a środowisko uruchomieniowe wtyczek startowych nie zostanie załadowane.

## Kiedy działa naprawa

Naprawa zależności uruchomieniowych powinna zostać uruchomiona, gdy spełniony jest jeden z tych warunków:

- efektywny plan wtyczek zmienił się i dodaje dołączone wtyczki wymagające zależności uruchomieniowych
- wygenerowany manifest zależności nie odpowiada już efektywnemu planowi
- oczekiwane znaczniki zainstalowanych pakietów są brakujące lub niekompletne
- zażądano `openclaw doctor --fix` lub `openclaw plugins deps --repair`

Naprawa zależności uruchomieniowych nie powinna być uruchamiana tylko dlatego, że OpenClaw wystartował. Normalne uruchomienie z niezmienionym planem i kompletną materializacją zależności powinno pominąć pracę menedżera pakietów.

Polecenia edytujące konfigurację, włączające wtyczki lub naprawiające ustalenia doctor mogą raz wejść w tryb planu wtyczek, zmaterializować nowo wymagane dołączone zależności, a następnie wrócić do normalnego przepływu polecenia. Lokalne `openclaw onboard` i `openclaw configure` robią to automatycznie po pomyślnym zapisaniu konfiguracji, aby następne uruchomienie Gateway nie odkryło brakujących pakietów dołączonych wtyczek już po rozpoczęciu startu. Zdalne onboarding/configure pozostaje tylko do odczytu dla lokalnych zależności uruchomieniowych.

## Reguła gorącego przeładowania

Ścieżki gorącego przeładowania, które mogą zmienić aktywne wtyczki, muszą wrócić przez tryb planu wtyczek przed załadowaniem środowiska uruchomieniowego wtyczki. Przeładowanie powinno porównać nowy efektywny plan wtyczek z poprzednim, przygotować brakujące zależności dla nowo aktywnych dołączonych wtyczek, a następnie załadować lub zrestartować dotknięte środowisko uruchomieniowe.

Jeśli przeładowanie konfiguracji nie zmienia efektywnego planu wtyczek, nie powinno naprawiać dołączonych zależności uruchomieniowych.

## Wykonanie menedżera pakietów

OpenClaw zapisuje wygenerowany manifest instalacji dla wybranych dołączonych zależności uruchomieniowych i uruchamia menedżera pakietów w katalogu głównym instalacji zależności uruchomieniowych. Preferuje `pnpm`, gdy jest dostępny, i wraca do dostarczanego z Node runnera `npm`.

Ścieżka `pnpm` używa zależności produkcyjnych, wyłącza skrypty cyklu życia, ignoruje workspace i utrzymuje magazyn wewnątrz katalogu głównego instalacji:

```bash
pnpm install \
  --prod \
  --ignore-scripts \
  --ignore-workspace \
  --config.frozen-lockfile=false \
  --config.minimum-release-age=0 \
  --config.store-dir=<install-root>/.openclaw-pnpm-store \
  --config.node-linker=hoisted \
  --config.virtual-store-dir=.pnpm
```

Zapasowa ścieżka `npm` używa bezpiecznego wrappera instalacji npm z zależnościami produkcyjnymi, wyłączonymi skryptami cyklu życia, wyłączonym trybem workspace, wyłączonym audytem, wyłączonym wyjściem fund, starszym zachowaniem zależności równorzędnych i włączonym wyjściem package-lock dla wygenerowanego katalogu głównego instalacji.

Po instalacji OpenClaw waliduje przygotowane drzewo zależności, zanim udostępni je katalogowi głównemu zależności uruchomieniowych. Izolowany etap jest kopiowany do katalogu głównego zależności uruchomieniowych i ponownie walidowany.

Cała sekcja naprawy/materializacji jest chroniona blokadą katalogu głównego instalacji. Bieżący właściciele blokady zapisują PID, czas startu procesu, gdy jest dostępny, oraz czas utworzenia. Starsze blokady bez dowodu czasu startu procesu lub czasu utworzenia są odzyskiwane wyłącznie na podstawie wieku systemu plików, więc blokady z ponownie użytym Docker PID 1 odzyskują się bez wygaszania zwykłych, długotrwałych bieżących instalacji wyłącznie na podstawie wieku.

## Katalogi główne instalacji

Instalacje pakietowe nie mogą modyfikować katalogów pakietów tylko do odczytu. OpenClaw może odczytywać katalogi główne zależności z warstw pakietowych, ale zapisuje wygenerowane zależności uruchomieniowe do zapisywalnego etapu, takiego jak:

- `OPENCLAW_PLUGIN_STAGE_DIR`
- `$STATE_DIRECTORY`
- `~/.openclaw/plugin-runtime-deps`
- `/var/lib/openclaw/plugin-runtime-deps` w instalacjach w stylu kontenerowym

Zapisywalny katalog główny jest końcowym celem materializacji. Starsze katalogi główne tylko do odczytu są zachowywane jako warstwy zgodności tylko wtedy, gdy są potrzebne.

Gdy aktualizacja pakietowego OpenClaw zmienia wersjonowany zapisywalny katalog główny, ale wybrany plan zależności dołączonych wtyczek nadal jest spełniony przez poprzedni przygotowany katalog główny, naprawa ponownie używa poprzedniego drzewa `node_modules` zamiast ponownie uruchamiać menedżera pakietów. Nowy wersjonowany katalog główny nadal otrzymuje własne aktualne lustro środowiska uruchomieniowego pakietu, więc kod wtyczki pochodzi z bieżącego pakietu OpenClaw, a niezmienione drzewa zależności są współdzielone między aktualizacjami. Ponowne użycie pomija poprzednie katalogi główne z aktywną blokadą zależności uruchomieniowych OpenClaw, więc nowy katalog główny nie łączy się z drzewem zależności, które inny proces Gateway, doctor lub CLI właśnie naprawia.

## Polecenia doctor i CLI

Użyj `plugins deps`, aby sprawdzić lub naprawić materializację zależności uruchomieniowych dołączonych wtyczek:

```bash
openclaw plugins deps
openclaw plugins deps --json
openclaw plugins deps --repair
openclaw plugins deps --prune
```

Użyj doctor, gdy stan zależności jest częścią szerszego stanu instalacji:

```bash
openclaw doctor
openclaw doctor --fix
```

`plugins deps` i doctor działają na należących do OpenClaw zależnościach uruchomieniowych dołączonych wtyczek wybranych przez efektywny plan wtyczek. Nie są poleceniami instalacji ani aktualizacji wtyczek firm trzecich.

## Rozwiązywanie problemów

Jeśli instalacja pakietowa zgłasza brakujące dołączone zależności uruchomieniowe:

1. Uruchom `openclaw plugins deps --json`, aby sprawdzić wybrany plan i brakujące pakiety.
2. Uruchom `openclaw plugins deps --repair` lub `openclaw doctor --fix`, aby naprawić zapisywalny etap zależności.
3. Jeśli katalog główny instalacji jest tylko do odczytu, ustaw `OPENCLAW_PLUGIN_STAGE_DIR` na zapisywalną ścieżkę i ponownie uruchom naprawę.
4. Zrestartuj Gateway po naprawie, jeśli brakująca zależność zablokowała ładowanie wtyczki startowej.

W checkoutach źródłowych instalacja workspace zwykle dostarcza zależności dołączonych wtyczek. Uruchom `pnpm install` w celu naprawy zależności źródłowych, zamiast używać naprawy pakietowych zależności uruchomieniowych jako pierwszego kroku.
