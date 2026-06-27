---
read_when:
    - Uruchamianie QA desktopowego Slacka Mantis z GitHuba lub lokalnie
    - Debugowanie wolnych uruchomień Mantis w aplikacji desktopowej Slack
    - Wybór trybu source, prehydrated lub warm-lease
    - Publikowanie dowodów w postaci zrzutów ekranu i nagrań wideo w PR
summary: 'Podręcznik operatora dla QA pulpitu Slack Mantis: GitHub dispatch, lokalne CLI, ciepłe dzierżawy VNC, tryby hydrate, interpretacja czasów, artefakty i obsługa awarii.'
title: Runbook Mantis Slack na komputer
x-i18n:
    generated_at: "2026-06-27T17:26:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9310b460a4da84afab72f9e5b5515a94e74b4f4a5030332bd2021d60deb07cc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack desktop QA to ścieżka z prawdziwym UI dla błędów klasy Slack, które wymagają
pulpitu Linux, ratunkowego VNC, Slack Web, prawdziwego Gateway OpenClaw, zrzutów ekranu,
nagrań wideo i komentarza z dowodami w PR.

Użyj jej, gdy testy jednostkowe albo bezgłowa ścieżka live Slack nie mogą udowodnić błędu.

## Model przechowywania

Mantis używa trzech różnych warstw przechowywania:

- Obraz dostawcy: zarządzany przez Crabbox i przechowywany na koncie dostawcy chmurowego.
  Zawiera możliwości maszyny, takie jak Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, natywne narzędzia build i puste katalogi pamięci podręcznej.
- Ciepły stan dzierżawy: zarządzany przez bieżącą sesję operatora. Może zawierać
  zalogowany profil przeglądarki, `/var/cache/crabbox/pnpm` oraz przygotowany checkout
  źródeł, dopóki dzierżawa jest aktywna.
- Artefakty Mantis: zarządzane przez przebieg OpenClaw. Znajdują się w
  `.artifacts/qa-e2e/mantis/...`, następnie GitHub Actions je przesyła, a
  aplikacja GitHub Mantis komentuje dowody inline w PR.

Nigdy nie umieszczaj sekretów, ciasteczek przeglądarki, stanu logowania Slack, checkoutów
repozytorium, `node_modules` ani `dist/` we wstępnie przygotowanym obrazie dostawcy.

## Dispatch GitHub

Uruchom workflow z `main`:

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

Dozwolone wartości `candidate_ref` są celowo wąskie, ponieważ workflow
używa poświadczeń live: bieżące pochodzenie `main`, tagi wydań albo głowica otwartego PR
z `openclaw/openclaw`.

Workflow zapisuje:

- przesłany artefakt: `mantis-slack-desktop-smoke-<run-id>-<attempt>`;
- komentarz inline w PR z aplikacji GitHub Mantis;
- `slack-desktop-smoke.png`;
- `slack-desktop-smoke.mp4`;
- `slack-desktop-smoke-preview.gif`;
- `slack-desktop-smoke-change.mp4`;
- `mantis-slack-desktop-smoke-summary.json`;
- `mantis-slack-desktop-smoke-report.md`;
- zdalne logi, takie jak `slack-desktop-command.log`, `openclaw-gateway.log`,
  `chrome.log` i `ffmpeg.log`.

Komentarz w PR jest aktualizowany w miejscu przez ukryty
marker `<!-- mantis-slack-desktop-smoke -->`.

## Lokalne CLI

Dowód ze świeżych źródeł:

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

Zachowaj VM do ratunkowego VNC:

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

Użyj ponownie ciepłej dzierżawy:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

Używaj `--hydrate-mode prehydrated` tylko wtedy, gdy ponownie używana zdalna przestrzeń robocza
ma już `node_modules` i zbudowane `dist/`. Mantis odmawia kontynuacji, jeśli ich
brakuje.

Udowodnij natywny UI zatwierdzania Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

Tryb punktów kontrolnych zatwierdzania wzajemnie wyklucza się z `--gateway-setup`. Uruchamia
opcjonalne scenariusze `slack-approval-exec-native` i `slack-approval-plugin-native`,
chyba że przekażesz jawne flagi punktów kontrolnych zatwierdzania `--scenario`; inne
scenariusze Slack są odrzucane przed startem VM. Runner QA Slack zapisuje
każdy plik JSON punktu kontrolnego z prawdziwej wiadomości API Slack, którą zaobserwował,
a następnie zdalny watcher renderuje migawkę tej wiadomości do
`approval-checkpoints/<scenario>-pending.png` i
`approval-checkpoints/<scenario>-resolved.png`. Przebieg kończy się niepowodzeniem, jeśli brakuje
jakiegokolwiek JSON punktu kontrolnego, dowodu wiadomości, JSON ack albo wyrenderowanego zrzutu ekranu,
albo jeśli są puste.

Zimne dzierżawy GitHub Actions nie mają ciasteczek Slack Web, więc ich przechwytywanie
przeglądarki może trafić na logowanie Slack. W przypadku dowodu punktu kontrolnego zatwierdzania ufaj
wyrenderowanym obrazom punktów kontrolnych i artefaktom QA Slack zamiast
`slack-desktop-smoke.png`. Użyj zachowanej ciepłej dzierżawy z ręcznie zalogowanym profilem
Slack Web tylko wtedy, gdy sam zrzut ekranu przeglądarki musi pokazywać Slack Web.

## Tryby hydrate

| Tryb          | Użyj, gdy                                  | Zachowanie zdalne                                                                       | Kompromis                                                 |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | Normalny dowód PR, zimne maszyny, CI        | Uruchamia `pnpm install --frozen-lockfile --prefer-offline` i `pnpm build` wewnątrz VM | Najwolniejszy, najsilniejszy dowód z checkoutu źródeł                 |
| `prehydrated` | Celowo przygotowano ponownie używaną dzierżawę | Wymaga istniejących `node_modules` i `dist/`; pomija install/build                     | Szybki, ale poprawny tylko dla ciepłych dzierżaw kontrolowanych przez operatora |

GitHub Actions zawsze przygotowuje checkout kandydata przed uruchomieniem VM. Jego
magazyn pnpm jest buforowany według systemu operacyjnego, wersji Node i pliku blokady. Przebieg źródłowy VM używa także
`/var/cache/crabbox/pnpm`, gdy jest dostępny.

## Interpretacja czasu

`mantis-slack-desktop-smoke-report.md` zawiera czasy faz:

- `crabbox.warmup`: rozruch dostawcy chmurowego, gotowość pulpitu/przeglądarki oraz SSH.
- `crabbox.inspect`: wyszukiwanie metadanych dzierżawy.
- `credentials.prepare`: pozyskanie dzierżawy poświadczeń Convex.
- `crabbox.remote_run`: synchronizacja, uruchomienie przeglądarki, instalacja/build OpenClaw albo
  walidacja hydrate, start Gateway, zrzut ekranu i przechwytywanie wideo.
- `artifacts.copy`: rsync z powrotem z VM.

`crabbox.remote_run` może być oznaczone jako `accepted`, gdy Crabbox zwraca niezerowy
zdalny status po tym, jak Mantis skopiował metadane dowodzące, że albo konfiguracja Gateway
OpenClaw została ukończona, albo samo polecenie QA Slack zakończyło się pomyślnie.
Traktuj `accepted` jako zaliczenie z wyjaśnieniem, a nie nieudany scenariusz.

Jeśli przebieg jest wolny:

- dominuje warmup: wstępnie przygotuj albo wypromuj lepszy obraz dostawcy Crabbox;
- dominuje remote_run w `source`: użyj ciepłej dzierżawy, popraw ponowne użycie magazynu pnpm
  albo przenieś wymagania maszyny do obrazu dostawcy;
- dominuje remote_run w `prehydrated`: zdalna przestrzeń robocza nie była faktycznie
  gotowa albo konfiguracja Gateway/przeglądarki/Slack jest wolna;
- dominuje kopiowanie artefaktów: sprawdź rozmiar wideo i zawartość katalogu artefaktów.

## Lista kontrolna dowodów

Dobry komentarz w PR powinien pokazywać:

- identyfikator scenariusza i SHA kandydata;
- URL przebiegu GitHub Actions;
- URL artefaktu;
- zrzut ekranu punktu kontrolnego zatwierdzania inline albo zrzut ekranu Slack Web z
  zalogowanej ciepłej dzierżawy;
- animowany podgląd inline, gdy jest dostępny;
- linki do pełnego MP4 i przyciętego MP4;
- status powodzenia/niepowodzenia;
- podsumowanie czasu w załączonym raporcie.

Nie commituj zrzutów ekranu ani nagrań wideo do repozytorium. Trzymaj je w artefaktach
GitHub Actions albo w komentarzu PR.

## Obsługa niepowodzeń

Jeśli workflow zawiedzie przed uruchomieniem VM, najpierw sprawdź zadanie Actions. Typowe
przyczyny to niezaufany `candidate_ref`, brakujące sekrety środowiska albo niepowodzenie
instalacji/buildu kandydata.

Jeśli przebieg VM zawiedzie, ale zrzuty ekranu zostały skopiowane z powrotem, sprawdź:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Jeśli przebieg zachował dzierżawę, otwórz VNC poleceniem `crabbox vnc ...` z raportu.
Zatrzymaj dzierżawę po zakończeniu:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Jeśli logowanie Slack wygasło, napraw je w VNC na zachowanej dzierżawie i uruchom ponownie z
`--lease-id`. Nie wypiekaj tego profilu przeglądarki w obrazie dostawcy.

## Powiązane

- [Przegląd QA](/pl/concepts/qa-e2e-automation)
- [Kanał Slack](/pl/channels/slack)
- [Testowanie](/pl/help/testing)
