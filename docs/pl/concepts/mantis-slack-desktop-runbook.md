---
read_when:
    - Uruchamianie desktopowych testów QA Mantis Slack z GitHub lub lokalnie
    - Debugowanie powolnych przebiegów Mantis dla desktopowego Slacka
    - Wybór trybu source, prehydrated lub warm-lease
    - Publikowanie w PR dowodów w postaci zrzutów ekranu i nagrań wideo
summary: 'Runbook operatora dla QA aplikacji desktopowej Mantis Slack: dispatch GitHub, lokalne CLI, podgrzane dzierżawy VNC, tryby hydrate, interpretacja czasu, artefakty i obsługa awarii.'
title: Procedura operacyjna aplikacji desktopowej Mantis Slack
x-i18n:
    generated_at: "2026-05-06T09:08:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83ca8792b53e5b14e592c2cbec6f6adfc936834e19f340f8e5eb3d467ecd3209
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack desktop QA to ścieżka z prawdziwym interfejsem użytkownika dla błędów klasy Slack, które wymagają
pulpitu Linux, ratunkowego VNC, Slack Web, prawdziwego Gateway OpenClaw, zrzutów ekranu,
nagrań wideo i komentarza z dowodami w PR.

Używaj jej, gdy testy jednostkowe lub bezgłowa ścieżka live Slack nie mogą udowodnić błędu.

## Model przechowywania

Mantis używa trzech różnych warstw przechowywania:

- Obraz dostawcy: należy do Crabbox i jest przechowywany na koncie dostawcy chmurowego.
  Zawiera możliwości maszyny, takie jak Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, natywne narzędzia do budowania oraz puste katalogi pamięci podręcznej.
- Stan ciepłej dzierżawy: należy do bieżącej sesji operatora. Może zawierać
  zalogowany profil przeglądarki, `/var/cache/crabbox/pnpm` oraz przygotowane pobranie źródeł
  podczas trwania dzierżawy.
- Artefakty Mantis: należą do uruchomienia OpenClaw. Znajdują się pod
  `.artifacts/qa-e2e/mantis/...`, następnie GitHub Actions je przesyła, a
  Mantis GitHub App komentuje dowody bezpośrednio w PR.

Nigdy nie umieszczaj sekretów, ciasteczek przeglądarki, stanu logowania Slack, pobrań repozytorium,
`node_modules` ani `dist/` we wstępnie wypieczonym obrazie dostawcy.

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
używa poświadczeń live: aktualne pochodzenie `main`, tagi wydań albo głowica otwartego PR
z `openclaw/openclaw`.

Workflow zapisuje:

- przesłany artefakt: `mantis-slack-desktop-smoke-<run-id>-<attempt>`;
- komentarz inline w PR z Mantis GitHub App;
- `slack-desktop-smoke.png`;
- `slack-desktop-smoke.mp4`;
- `slack-desktop-smoke-preview.gif`;
- `slack-desktop-smoke-change.mp4`;
- `mantis-slack-desktop-smoke-summary.json`;
- `mantis-slack-desktop-smoke-report.md`;
- zdalne logi, takie jak `slack-desktop-command.log`, `openclaw-gateway.log`,
  `chrome.log` i `ffmpeg.log`.

Komentarz PR jest aktualizowany w miejscu przez ukryty
znacznik `<!-- mantis-slack-desktop-smoke -->`.

## Lokalne CLI

Zimny dowód źródłowy:

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

Zachowaj maszynę wirtualną do ratunkowego VNC:

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

Używaj `--hydrate-mode prehydrated` tylko wtedy, gdy ponownie używany zdalny obszar roboczy już
ma `node_modules` i zbudowane `dist/`. Mantis kończy się zamknięciem w razie braku tych elementów.

## Tryby hydrate

| Tryb          | Kiedy używać                              | Zachowanie zdalne                                                                      | Kompromis                                                |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | Normalny dowód PR, zimne maszyny, CI      | Uruchamia `pnpm install --frozen-lockfile --prefer-offline` i `pnpm build` wewnątrz maszyny wirtualnej | Najwolniejszy, najsilniejszy dowód pobrania źródeł       |
| `prehydrated` | Celowo przygotowano ponownie używaną dzierżawę | Wymaga istniejących `node_modules` i `dist/`; pomija instalację/budowanie              | Szybki, ale poprawny tylko dla ciepłych dzierżaw kontrolowanych przez operatora |

GitHub Actions zawsze przygotowuje pobranie kandydata przed uruchomieniem maszyny wirtualnej. Jego
magazyn pnpm jest buforowany według systemu operacyjnego, wersji Node i pliku blokady. Uruchomienie źródłowe w maszynie wirtualnej także
używa `/var/cache/crabbox/pnpm`, gdy jest obecne.

## Interpretacja czasu

`mantis-slack-desktop-smoke-report.md` zawiera czasy faz:

- `crabbox.warmup`: rozruch dostawcy chmurowego, gotowość pulpitu/przeglądarki i SSH.
- `crabbox.inspect`: wyszukiwanie metadanych dzierżawy.
- `credentials.prepare`: uzyskanie dzierżawy poświadczeń Convex.
- `crabbox.remote_run`: synchronizacja, uruchomienie przeglądarki, instalacja/budowanie OpenClaw albo
  walidacja hydrate, start Gateway, zrzut ekranu i przechwytywanie wideo.
- `artifacts.copy`: rsync z powrotem z maszyny wirtualnej.

`crabbox.remote_run` może być oznaczone jako `accepted`, gdy Crabbox zwraca niezerowy
zdalny status po tym, jak Mantis skopiował metadane dowodzące, że Gateway OpenClaw
działa, a konfiguracja została ukończona. Traktuj `accepted` jako powodzenie z wyjaśnieniem,
a nie jako nieudany scenariusz.

Jeśli uruchomienie jest wolne:

- dominuje warmup: wstępnie wypiecz albo wypromuj lepszy obraz dostawcy Crabbox;
- remote_run dominuje w `source`: użyj ciepłej dzierżawy, popraw ponowne użycie magazynu pnpm
  albo przenieś wymagania wstępne maszyny do obrazu dostawcy;
- remote_run dominuje w `prehydrated`: zdalny obszar roboczy nie był faktycznie
  gotowy albo konfiguracja Gateway/przeglądarki/Slack jest wolna;
- dominuje kopiowanie artefaktów: sprawdź rozmiar wideo i zawartość katalogu artefaktów.

## Lista kontrolna dowodów

Dobry komentarz PR powinien pokazywać:

- identyfikator scenariusza i SHA kandydata;
- URL uruchomienia GitHub Actions;
- URL artefaktu;
- zrzut ekranu inline;
- animowany podgląd inline, gdy jest dostępny;
- linki do pełnego MP4 i przyciętego MP4;
- status powodzenia/niepowodzenia;
- podsumowanie czasów w dołączonym raporcie.

Nie commituj zrzutów ekranu ani nagrań wideo do repozytorium. Trzymaj je w artefaktach GitHub
Actions albo w komentarzu PR.

## Obsługa awarii

Jeśli workflow kończy się niepowodzeniem przed uruchomieniem maszyny wirtualnej, najpierw sprawdź zadanie Actions. Typowe
przyczyny to niezaufany `candidate_ref`, brakujące sekrety środowiska albo niepowodzenie instalacji/budowania kandydata.

Jeśli uruchomienie maszyny wirtualnej kończy się niepowodzeniem, ale zrzuty ekranu zostały skopiowane z powrotem, sprawdź:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Jeśli uruchomienie zachowało dzierżawę, otwórz VNC poleceniem `crabbox vnc ...` z raportu.
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
