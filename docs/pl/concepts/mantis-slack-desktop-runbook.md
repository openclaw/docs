---
read_when:
    - Uruchamianie testów QA aplikacji komputerowej Mantis Slack z GitHub lub lokalnie
    - Debugowanie powolnego działania Mantis w aplikacji komputerowej Slack
    - Wybór trybu źródłowego, wstępnie przygotowanego lub z aktywną dzierżawą
    - Publikowanie zrzutów ekranu i nagrań wideo jako materiałów dowodowych w PR
summary: 'Podręcznik operacyjny testów jakości aplikacji komputerowej Slack w Mantis: uruchamianie przez GitHub, lokalny interfejs CLI, utrzymywane sesje VNC, tryby przygotowania środowiska, interpretacja czasów, artefakty i obsługa błędów.'
title: Podręcznik operacyjny Mantis dla aplikacji Slack na komputerze
x-i18n:
    generated_at: "2026-07-12T15:03:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3e956d99fc43a7b6fe65e2e820812b0e0e8b9e32badd25be27c74d302ab30dc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack desktop QA to ścieżka testów z rzeczywistym interfejsem użytkownika dla błędów klasy Slack, które wymagają
pulpitu Linux, awaryjnego dostępu przez VNC, Slack Web, rzeczywistego Gateway OpenClaw, zrzutów ekranu,
nagrań wideo i komentarza z dowodami w PR. Używaj jej, gdy testy jednostkowe lub bezgłowa
ścieżka testów Slack na żywo nie mogą potwierdzić błędu.

## Model przechowywania

Mantis używa trzech warstw przechowywania:

- **Obraz dostawcy** — należy do Crabbox i jest przechowywany na koncie dostawcy chmury.
  Zawiera możliwości maszyny (Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, natywne narzędzia kompilacyjne) oraz puste katalogi pamięci podręcznej.
- **Stan rozgrzanej dzierżawy** — należy do bieżącej sesji operatora. Może zawierać
  zalogowany profil przeglądarki, `/var/cache/crabbox/pnpm` oraz przygotowaną kopię roboczą
  kodu źródłowego przez czas trwania dzierżawy.
- **Artefakty Mantis** — należą do uruchomienia OpenClaw. Znajdują się w
  `.artifacts/qa-e2e/mantis/...`; GitHub Actions je przesyła, a aplikacja Mantis
  GitHub App dodaje komentarz z dowodami bezpośrednio w PR.

Nigdy nie umieszczaj sekretów, plików cookie przeglądarki, stanu logowania do Slack, kopii roboczych repozytorium,
`node_modules` ani `dist/` w obrazie dostawcy.

## Uruchamianie przez GitHub

Uruchom przepływ pracy z `main`:

```bash
gh workflow run mantis-slack-desktop-smoke.yml \
  --ref main \
  -f candidate_ref=<trusted-ref-or-sha> \
  -f pr_number=<pr-number> \
  -f scenario_id=slack-canary \
  -f crabbox_provider=aws \
  -f keep_vm=false \
  -f hydrate_mode=source
```

`candidate_ref` podlega ograniczeniom, ponieważ przepływ pracy używa rzeczywistych danych uwierzytelniających:
musi wskazywać element w historii bieżącej gałęzi `main`, tag wydania lub głowę otwartego PR
w `openclaw/openclaw`.

Przepływ pracy generuje:

- przesłany artefakt `mantis-slack-desktop-smoke-<run-id>-<attempt>`
- komentarz bezpośrednio w PR od aplikacji Mantis GitHub App
- `slack-desktop-smoke.png`, `slack-desktop-smoke.mp4`
- `slack-desktop-smoke-preview.gif`, `slack-desktop-smoke-change.mp4`
- `mantis-slack-desktop-smoke-summary.json`, `mantis-slack-desktop-smoke-report.md`
- zdalne dzienniki: `slack-desktop-command.log`, `openclaw-gateway.log`, `chrome.log`, `ffmpeg.log`

Komentarz w PR jest aktualizowany w miejscu za pomocą ukrytego znacznika `<!-- mantis-slack-desktop-smoke -->`.

## Lokalne CLI

Weryfikacja kodu źródłowego na zimno:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --credential-source convex \
  --credential-role maintainer \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --scenario slack-canary \
  --hydrate-mode source
```

Zachowaj maszynę wirtualną do awaryjnego dostępu przez VNC:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Otwórz VNC:

```bash
crabbox vnc --provider aws --id <cbx_id> --open
```

Użyj ponownie rozgrzanej dzierżawy:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

Używaj `--hydrate-mode prehydrated` tylko wtedy, gdy ponownie używany zdalny obszar roboczy ma już
`node_modules` i skompilowany katalog `dist/`; w przeciwnym razie Mantis bezpiecznie przerywa działanie.

Potwierdź natywny interfejs zatwierdzania Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

`--approval-checkpoints` i `--gateway-setup` wzajemnie się wykluczają. Ta opcja uruchamia
dobrowolnie włączane scenariusze `slack-approval-exec-native` i `slack-approval-plugin-native`,
chyba że przekażesz jawny scenariusz punktu kontrolnego zatwierdzania przez `--scenario`; pozostałe
scenariusze Slack są odrzucane przed uruchomieniem maszyny wirtualnej. Program uruchamiający QA Slack zapisuje
każdy plik JSON punktu kontrolnego na podstawie rzeczywistej wiadomości API Slack, którą zaobserwował, a następnie
zdalny proces monitorujący renderuje tę wiadomość do
`approval-checkpoints/<scenario>-pending.png` i
`approval-checkpoints/<scenario>-resolved.png`. Uruchomienie kończy się niepowodzeniem, jeśli brakuje
któregokolwiek pliku JSON punktu kontrolnego, dowodu wiadomości, pliku JSON potwierdzenia odbioru lub wyrenderowanego zrzutu ekranu
albo jeśli którykolwiek z nich jest pusty.

Zimne dzierżawy GitHub Actions nie mają plików cookie Slack Web, więc przechwytywanie obrazu z przeglądarki
może zakończyć się na ekranie logowania Slack. Przy weryfikacji punktów kontrolnych zatwierdzania należy polegać na
wyrenderowanych obrazach punktów kontrolnych i artefaktach QA Slack, a nie na
`slack-desktop-smoke.png`. Zachowanej rozgrzanej dzierżawy z ręcznie
zalogowanym profilem Slack Web używaj tylko wtedy, gdy sam zrzut ekranu przeglądarki musi przedstawiać
Slack Web.

## Tryby przygotowania

| Tryb          | Kiedy używać                                  | Zachowanie zdalne                                                                       | Kompromis                                                 |
| ------------- | --------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `source`      | Zwykła weryfikacja PR, zimne maszyny, CI      | Uruchamia `pnpm install --frozen-lockfile --prefer-offline` i `pnpm build` wewnątrz maszyny wirtualnej | Najwolniejszy, zapewnia najsilniejszą weryfikację kopii roboczej kodu źródłowego |
| `prehydrated` | Celowo przygotowano ponownie używaną dzierżawę | Wymaga istniejących `node_modules` i `dist/`; pomija instalację i kompilację              | Szybki, ale prawidłowy tylko dla rozgrzanych dzierżaw kontrolowanych przez operatora |

GitHub Actions zawsze przygotowuje kopię roboczą kandydata przed uruchomieniem maszyny wirtualnej. Magazyn
pnpm jest buforowany według systemu operacyjnego, wersji Node i pliku blokady. Uruchomienie maszyny wirtualnej w trybie `source`
również używa ponownie `/var/cache/crabbox/pnpm`, jeśli jest dostępny.

## Interpretacja czasów

`mantis-slack-desktop-smoke-report.md` zawiera czasy poszczególnych faz:

- `crabbox.warmup` — uruchomienie u dostawcy chmury, gotowość pulpitu/przeglądarki, SSH.
- `crabbox.inspect` — pobranie metadanych dzierżawy.
- `credentials.prepare` — pozyskanie dzierżawy danych uwierzytelniających Convex.
- `crabbox.remote_run` — synchronizacja, uruchomienie przeglądarki, instalacja/kompilacja OpenClaw lub
  weryfikacja przygotowania, uruchomienie Gateway, wykonanie zrzutu ekranu i nagranie wideo.
- `artifacts.copy` — synchronizacja zwrotna przez rsync z maszyny wirtualnej.

`crabbox.remote_run` może mieć stan `accepted`, gdy Crabbox zwróci niezerowy
zdalny kod stanu, ale Mantis skopiuje metadane potwierdzające, że konfiguracja Gateway OpenClaw
została ukończona albo samo polecenie QA Slack zakończyło się pomyślnie. Traktuj
`accepted` jako powodzenie z wyjaśnieniem, a nie jako nieudany scenariusz.

Jeśli uruchomienie trwa długo:

- Dominuje rozgrzewanie: przygotuj wcześniej lub wypromuj lepszy obraz dostawcy Crabbox.
- `remote_run` dominuje w trybie `source`: użyj rozgrzanej dzierżawy, popraw ponowne użycie magazynu
  pnpm lub przenieś wymagania wstępne maszyny do obrazu dostawcy.
- `remote_run` dominuje w trybie `prehydrated`: zdalny obszar roboczy nie był
  faktycznie gotowy albo konfiguracja Gateway/przeglądarki/Slack jest powolna.
- Dominuje kopiowanie artefaktów: sprawdź rozmiar nagrania i zawartość katalogu artefaktów.

## Lista kontrolna dowodów

Dobry komentarz w PR zawiera:

- identyfikator scenariusza i SHA kandydata
- adres URL uruchomienia GitHub Actions i adres URL artefaktu
- osadzony zrzut ekranu punktu kontrolnego zatwierdzania albo zrzut ekranu Slack Web z
  zalogowanej rozgrzanej dzierżawy
- osadzony animowany podgląd, jeśli jest dostępny
- odnośniki do pełnego i przyciętego pliku MP4
- stan powodzenia/niepowodzenia oraz podsumowanie czasów z raportu

Nie zatwierdzaj zrzutów ekranu ani nagrań wideo w repozytorium. Przechowuj je w artefaktach
GitHub Actions lub komentarzu w PR.

## Obsługa niepowodzeń

Jeśli przepływ pracy zakończy się niepowodzeniem przed uruchomieniem maszyny wirtualnej, najpierw sprawdź zadanie Actions.
Typowe przyczyny: niezaufany `candidate_ref`, brak sekretów środowiska lub
niepowodzenie instalacji/kompilacji kandydata.

Jeśli uruchomienie maszyny wirtualnej zakończy się niepowodzeniem, ale zrzuty ekranu zostały skopiowane z powrotem, sprawdź:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Jeśli uruchomienie zachowało dzierżawę, otwórz VNC za pomocą polecenia `crabbox vnc ...`
z raportu, a po zakończeniu zatrzymaj dzierżawę:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Jeśli logowanie do Slack wygasło, napraw je przez VNC w zachowanej dzierżawie i uruchom ponownie
z `--lease-id`. Nie umieszczaj tego profilu przeglądarki w obrazie dostawcy.

## Powiązane

- [Przegląd QA](/pl/concepts/qa-e2e-automation)
- [Kanał Slack](/pl/channels/slack)
- [Testowanie](/pl/help/testing)
