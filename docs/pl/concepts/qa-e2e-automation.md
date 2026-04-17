---
read_when:
    - Rozszerzanie qa-lab lub qa-channel
    - Dodawanie scenariuszy QA opartych na repozytorium
    - Tworzenie bardziej realistycznej automatyzacji QA wokół panelu Gateway
summary: Prywatny kształt automatyzacji QA dla qa-lab, qa-channel, scenariuszy z seedem i raportów protokołu
title: Automatyzacja QA E2E
x-i18n:
    generated_at: "2026-04-17T09:49:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51f97293c184d7c04c95d9858305668fbc0f93273f587ec7e54896ad5d603ab0
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automatyzacja QA E2E

Prywatny stos QA ma na celu testowanie OpenClaw w sposób bardziej realistyczny,
ukształtowany przez kanały, niż może to zrobić pojedynczy test jednostkowy.

Obecne elementy:

- `extensions/qa-channel`: syntetyczny kanał wiadomości z powierzchniami DM, kanału, wątku,
  reakcji, edycji i usuwania.
- `extensions/qa-lab`: interfejs debuggera i magistrala QA do obserwowania transkryptu,
  wstrzykiwania wiadomości przychodzących i eksportowania raportu Markdown.
- `qa/`: zasoby seedów oparte na repozytorium dla zadania startowego i bazowych
  scenariuszy QA.

Obecny przepływ pracy operatora QA to dwupanelowa witryna QA:

- Po lewej: panel Gateway (Control UI) z agentem.
- Po prawej: QA Lab, pokazujący transkrypt w stylu Slacka i plan scenariusza.

Uruchom za pomocą:

```bash
pnpm qa:lab:up
```

To buduje witrynę QA, uruchamia ścieżkę Gateway opartą na Dockerze i udostępnia
stronę QA Lab, gdzie operator lub pętla automatyzacji może dać agentowi misję QA,
obserwować rzeczywiste zachowanie kanału oraz rejestrować, co zadziałało, co się nie powiodło
i co pozostało zablokowane.

Aby szybciej iterować nad interfejsem QA Lab bez przebudowywania obrazu Dockera za każdym razem,
uruchom stos z pakietem QA Lab montowanym przez bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` utrzymuje usługi Dockera na wcześniej zbudowanym obrazie i montuje przez bind mount
`extensions/qa-lab/web/dist` do kontenera `qa-lab`. `qa:lab:watch`
przebudowuje ten pakiet przy zmianach, a przeglądarka automatycznie przeładowuje się, gdy zmienia się hash zasobów QA Lab.

Aby uruchomić ścieżkę smoke z rzeczywistym transportem Matrix, wykonaj:

```bash
pnpm openclaw qa matrix
```

Ta ścieżka tworzy w Dockerze jednorazowy homeserver Tuwunel, rejestruje
tymczasowych użytkowników driver, SUT i observer, tworzy jeden prywatny pokój, a następnie uruchamia
rzeczywistą wtyczkę Matrix wewnątrz procesu podrzędnego QA Gateway. Ścieżka z żywym transportem utrzymuje
konfigurację procesu podrzędnego ograniczoną do testowanego transportu, więc Matrix działa bez
`qa-channel` w konfiguracji procesu podrzędnego. Zapisuje uporządkowane artefakty raportu oraz
połączony log stdout/stderr do wybranego katalogu wyjściowego Matrix QA. Aby przechwycić
również zewnętrzne dane wyjściowe budowania/uruchamiania z `scripts/run-node.mjs`, ustaw
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` na plik logu lokalny względem repozytorium.

Aby uruchomić ścieżkę smoke z rzeczywistym transportem Telegram, wykonaj:

```bash
pnpm openclaw qa telegram
```

Ta ścieżka jest kierowana do jednej rzeczywistej prywatnej grupy Telegram zamiast tworzyć
jednorazowy serwer. Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` oraz
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, a także dwóch różnych botów w tej samej
prywatnej grupie. Bot SUT musi mieć nazwę użytkownika Telegram, a obserwacja bot-do-bot
działa najlepiej, gdy oba boty mają włączony tryb Bot-to-Bot Communication Mode
w `@BotFather`.

Ścieżki z żywym transportem współdzielą teraz jeden mniejszy kontrakt zamiast tego, by każda definiowała
własny kształt listy scenariuszy:

`qa-channel` pozostaje szerokim syntetycznym zestawem testów zachowania produktu i nie jest częścią
macierzy pokrycia dla żywego transportu.

| Ścieżka  | Canary | Ograniczanie odpowiedzi wzmiankami | Blokada allowlist | Odpowiedź najwyższego poziomu | Wznowienie po restarcie | Kontynuacja wątku | Izolacja wątku | Obserwacja reakcji | Polecenie pomocy |
| -------- | ------ | ---------------------------------- | ----------------- | ----------------------------- | ----------------------- | ----------------- | -------------- | ------------------ | ---------------- |
| Matrix   | x      | x                                  | x                 | x                             | x                       | x                 | x              | x                  |                  |
| Telegram | x      |                                    |                   |                               |                         |                   |                |                    | x                |

Dzięki temu `qa-channel` pozostaje szerokim zestawem testów zachowania produktu, podczas gdy Matrix,
Telegram i przyszłe żywe transporty współdzielą jedną jawną checklistę kontraktu transportu.

Aby uruchomić jednorazową ścieżkę na maszynie wirtualnej Linux bez włączania Dockera do ścieżki QA, wykonaj:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

To uruchamia świeżego gościa Multipass, instaluje zależności, buduje OpenClaw
wewnątrz gościa, uruchamia `qa suite`, a następnie kopiuje zwykły raport QA i
podsumowanie z powrotem do `.artifacts/qa-e2e/...` na hoście.
Wykorzystuje to samo zachowanie wyboru scenariuszy co `qa suite` na hoście.
Uruchomienia hosta i Multipass suite wykonują domyślnie wiele wybranych scenariuszy równolegle
z izolowanymi workerami Gateway, do 64 workerów lub liczby wybranych scenariuszy.
Użyj `--concurrency <count>`, aby dostroić liczbę workerów, lub
`--concurrency 1` dla wykonania sekwencyjnego.
Uruchomienia live przekazują obsługiwane wejścia uwierzytelniania QA, które są praktyczne dla
gościa: klucze dostawcy oparte na env, ścieżkę konfiguracji dostawcy QA live oraz
`CODEX_HOME`, jeśli jest obecne. Zachowaj `--output-dir` pod katalogiem głównym repozytorium, aby gość
mógł zapisywać z powrotem przez zamontowaną przestrzeń roboczą.

## Seedy oparte na repozytorium

Zasoby seedów znajdują się w `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Są one celowo przechowywane w git, aby plan QA był widoczny zarówno dla ludzi, jak i dla
agenta.

`qa-lab` powinien pozostać ogólnym runnerem Markdown. Każdy plik Markdown scenariusza jest
źródłem prawdy dla jednego przebiegu testowego i powinien definiować:

- metadane scenariusza
- odwołania do dokumentacji i kodu
- opcjonalne wymagania dotyczące wtyczek
- opcjonalną łatkę konfiguracji Gateway
- wykonywalny `qa-flow`

Współdzielona powierzchnia runtime, która obsługuje `qa-flow`, może pozostać ogólna
i przekrojowa. Na przykład scenariusze Markdown mogą łączyć pomocniki po stronie transportu
z pomocnikami po stronie przeglądarki, które sterują osadzonym Control UI przez
interfejs Gateway `browser.request`, bez dodawania specjalnego runnera.

Lista bazowa powinna pozostać na tyle szeroka, aby obejmować:

- czat DM i kanałowy
- zachowanie wątku
- cykl życia akcji wiadomości
- wywołania zwrotne Cron
- przywoływanie pamięci
- przełączanie modeli
- przekazanie do subagenta
- odczyt repozytorium i dokumentacji
- jedno małe zadanie budowania, takie jak Lobster Invaders

## Ścieżki mock dostawców

`qa suite` ma dwie lokalne ścieżki mock dostawców:

- `mock-openai` to świadomy scenariuszy mock OpenClaw. Pozostaje domyślną
  deterministyczną ścieżką mock dla QA opartego na repozytorium i bramek parzystości.
- `aimock` uruchamia serwer dostawcy oparty na AIMock do eksperymentalnego pokrycia
  protokołu, fixture, record/replay i chaos. Jest dodatkiem i nie zastępuje
  dispatcher scenariuszy `mock-openai`.

Implementacja ścieżek dostawców znajduje się w `extensions/qa-lab/src/providers/`.
Każdy dostawca zarządza własnymi ustawieniami domyślnymi, uruchamianiem lokalnego serwera,
konfiguracją modelu Gateway, potrzebami etapowania profilu auth oraz flagami możliwości live/mock.
Współdzielony kod suite i Gateway powinien kierować przez rejestr dostawców zamiast rozgałęziać się
na podstawie nazw dostawców.

## Adaptery transportu

`qa-lab` posiada ogólny interfejs transportu dla scenariuszy QA w Markdown.
`qa-channel` jest pierwszym adapterem tego interfejsu, ale docelowy projekt jest szerszy:
przyszłe kanały rzeczywiste lub syntetyczne powinny podłączać się do tego samego runnera suite
zamiast dodawania runnera QA specyficznego dla transportu.

Na poziomie architektury podział wygląda następująco:

- `qa-lab` odpowiada za ogólne wykonywanie scenariuszy, współbieżność workerów, zapisywanie artefaktów i raportowanie.
- adapter transportu odpowiada za konfigurację Gateway, gotowość, obserwację wejścia i wyjścia, akcje transportu oraz znormalizowany stan transportu.
- pliki scenariuszy Markdown w `qa/scenarios/` definiują przebieg testu; `qa-lab` dostarcza współdzieloną powierzchnię runtime, która go wykonuje.

Wskazówki wdrożeniowe dla maintainerów dotyczące nowych adapterów kanałów znajdują się w
[Testing](/pl/help/testing#adding-a-channel-to-qa).

## Raportowanie

`qa-lab` eksportuje raport protokołu Markdown na podstawie obserwowanej osi czasu magistrali.
Raport powinien odpowiadać na pytania:

- Co zadziałało
- Co się nie powiodło
- Co pozostało zablokowane
- Jakie scenariusze uzupełniające warto dodać

Aby przeprowadzić sprawdzenia charakteru i stylu, uruchom ten sam scenariusz na wielu referencjach modeli live
i zapisz oceniany raport Markdown:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=xhigh \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.4,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

To polecenie uruchamia lokalne procesy podrzędne QA Gateway, a nie Docker. Scenariusze
character eval powinny ustawiać personę przez `SOUL.md`, a następnie wykonywać zwykłe tury użytkownika,
takie jak czat, pomoc w przestrzeni roboczej i małe zadania na plikach. Kandydacki model
nie powinien być informowany, że jest oceniany. Polecenie zachowuje każdy pełny
transkrypt, rejestruje podstawowe statystyki uruchomienia, a następnie prosi modele oceniające w trybie fast z
rozumowaniem `xhigh`, aby uszeregowały przebiegi według naturalności, klimatu i humoru.
Użyj `--blind-judge-models` podczas porównywania dostawców: prompt sędziego nadal otrzymuje
każdy transkrypt i status uruchomienia, ale referencje kandydatów są zastępowane
neutralnymi etykietami, takimi jak `candidate-01`; raport mapuje rankingi z powrotem na rzeczywiste referencje po
parsowaniu.
Przebiegi kandydatów domyślnie używają poziomu myślenia `high`, z `xhigh` dla modeli OpenAI, które
go obsługują. Zastąp ustawienie konkretnego kandydata inline przez
`--model provider/model,thinking=<level>`. `--thinking <level>` nadal ustawia
globalny fallback, a starsza forma `--model-thinking <provider/model=level>` jest
zachowana dla kompatybilności.
Referencje kandydatów OpenAI domyślnie używają trybu fast, aby tam, gdzie dostawca to obsługuje,
wykorzystywane było przetwarzanie priorytetowe. Dodaj inline `,fast`, `,no-fast` lub `,fast=false`, gdy
pojedynczy kandydat lub sędzia wymaga nadpisania. Przekaż `--fast` tylko wtedy, gdy chcesz
wymusić tryb fast dla każdego modelu kandydata. Czasy trwania dla kandydatów i sędziów są
rejestrowane w raporcie na potrzeby analizy benchmarków, ale prompty sędziów wyraźnie mówią,
aby nie oceniać na podstawie szybkości.
Zarówno przebiegi modeli kandydatów, jak i sędziów domyślnie używają współbieżności 16. Zmniejsz
`--concurrency` lub `--judge-concurrency`, gdy limity dostawcy lub obciążenie lokalnego Gateway
powodują, że przebieg staje się zbyt zaszumiony.
Gdy nie przekazano żadnego kandydata `--model`, character eval domyślnie używa
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` oraz
`google/gemini-3.1-pro-preview`, gdy nie przekazano `--model`.
Gdy nie przekazano `--judge-model`, sędziowie domyślnie używają
`openai/gpt-5.4,thinking=xhigh,fast` oraz
`anthropic/claude-opus-4-6,thinking=high`.

## Powiązana dokumentacja

- [Testing](/pl/help/testing)
- [QA Channel](/pl/channels/qa-channel)
- [Dashboard](/web/dashboard)
