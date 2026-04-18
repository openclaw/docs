---
read_when:
    - Rozszerzanie qa-lab lub qa-channel
    - Dodawanie scenariuszy QA opartych na repozytorium
    - Budowanie bardziej realistycznej automatyzacji QA wokół panelu Gateway
summary: Prywatna struktura automatyzacji QA dla qa-lab, qa-channel, scenariuszy seedowanych i raportów protokołu
title: Automatyzacja QA E2E
x-i18n:
    generated_at: "2026-04-18T09:34:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: adf8c5f74e8fabdc8e9fd7ecd41afce8b60354c7dd24d92ac926d3c527927cd4
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automatyzacja QA E2E

Prywatny stos QA ma na celu testowanie OpenClaw w bardziej realistyczny,
kanałowy sposób niż pojedynczy test jednostkowy.

Obecne elementy:

- `extensions/qa-channel`: syntetyczny kanał wiadomości z powierzchniami DM, kanału, wątku,
  reakcji, edycji i usuwania.
- `extensions/qa-lab`: interfejs debuggera i magistrala QA do obserwowania transkryptu,
  wstrzykiwania wiadomości przychodzących i eksportowania raportu Markdown.
- `qa/`: zasoby seedowane oparte na repozytorium dla zadania startowego i bazowych scenariuszy QA.

Obecny przepływ pracy operatora QA to dwupanelowa witryna QA:

- Po lewej: panel Gateway (Control UI) z agentem.
- Po prawej: QA Lab, pokazujący transkrypt w stylu Slacka i plan scenariusza.

Uruchom za pomocą:

```bash
pnpm qa:lab:up
```

To buduje witrynę QA, uruchamia opartą na Dockerze ścieżkę gateway i udostępnia
stronę QA Lab, na której operator lub pętla automatyzacji może zlecić agentowi
misję QA, obserwować rzeczywiste zachowanie kanału oraz rejestrować, co zadziałało,
co się nie udało i co pozostało zablokowane.

Aby szybciej iterować nad interfejsem QA Lab bez przebudowywania obrazu Docker przy każdej zmianie,
uruchom stos z podmontowanym pakietem QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` utrzymuje usługi Docker na wcześniej zbudowanym obrazie i bind-mountuje
`extensions/qa-lab/web/dist` do kontenera `qa-lab`. `qa:lab:watch`
przebudowuje ten pakiet przy zmianach, a przeglądarka automatycznie przeładowuje się, gdy zmienia się hash zasobów QA Lab.

Dla ścieżki smoke Matrix z rzeczywistym transportem uruchom:

```bash
pnpm openclaw qa matrix
```

Ta ścieżka udostępnia jednorazowy homeserver Tuwunel w Dockerze, rejestruje
tymczasowych użytkowników drivera, SUT i obserwatora, tworzy jeden prywatny pokój,
a następnie uruchamia prawdziwy Plugin Matrix wewnątrz procesu podrzędnego QA gateway. Ścieżka z żywym transportem utrzymuje konfigurację procesu podrzędnego ograniczoną do testowanego transportu, dzięki czemu Matrix działa bez
`qa-channel` w konfiguracji procesu podrzędnego. Zapisuje ustrukturyzowane artefakty raportu oraz
połączony log stdout/stderr do wybranego katalogu wyjściowego Matrix QA. Aby
przechwycić także zewnętrzne dane wyjściowe budowania/uruchamiania z `scripts/run-node.mjs`,
ustaw `OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` na plik logu lokalny względem repozytorium.

Dla ścieżki smoke Telegram z rzeczywistym transportem uruchom:

```bash
pnpm openclaw qa telegram
```

Ta ścieżka kieruje ruch do jednej prawdziwej prywatnej grupy Telegram zamiast udostępniać
jednorazowy serwer. Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` i
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, a także dwóch różnych botów w tej samej
prywatnej grupie. Bot SUT musi mieć nazwę użytkownika Telegram, a obserwacja bot-do-bota
działa najlepiej, gdy oba boty mają włączony Bot-to-Bot Communication Mode
w `@BotFather`.

Ścieżki z żywym transportem współdzielą teraz jeden mniejszy kontrakt zamiast tego, by każda definiowała
własny kształt listy scenariuszy:

`qa-channel` pozostaje szerokim syntetycznym zestawem zachowań produktu i nie jest częścią
macierzy pokrycia dla żywego transportu.

| Ścieżka  | Canary | Bramka wzmianki | Blokada allowlisty | Odpowiedź najwyższego poziomu | Wznowienie po restarcie | Dalszy ciąg w wątku | Izolacja wątku | Obserwacja reakcji | Polecenie pomocy |
| -------- | ------ | --------------- | ------------------ | ----------------------------- | ----------------------- | ------------------- | -------------- | ------------------ | ---------------- |
| Matrix   | x      | x               | x                  | x                             | x                       | x                   | x              | x                  |                  |
| Telegram | x      |                 |                    |                               |                         |                     |                |                    | x                |

Dzięki temu `qa-channel` pozostaje szerokim zestawem zachowań produktu, podczas gdy Matrix,
Telegram i przyszłe żywe transporty współdzielą jedną jawną checklistę kontraktu transportowego.

Dla ścieżki z jednorazową maszyną wirtualną Linux bez wprowadzania Dockera do ścieżki QA uruchom:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

To uruchamia świeżego gościa Multipass, instaluje zależności, buduje OpenClaw
wewnątrz gościa, uruchamia `qa suite`, a następnie kopiuje zwykły raport QA i
podsumowanie z powrotem do `.artifacts/qa-e2e/...` na hoście.
Wykorzystuje to samo zachowanie wyboru scenariuszy co `qa suite` na hoście.
Uruchomienia hosta i Multipass suite domyślnie wykonują wiele wybranych scenariuszy równolegle
z izolowanymi workerami gateway, maksymalnie do 64 workerów lub liczby wybranych
scenariuszy. Użyj `--concurrency <count>`, aby dostroić liczbę workerów, albo
`--concurrency 1` dla wykonania szeregowego.
Uruchomienia na żywo przekazują obsługiwane dane uwierzytelniające QA, które są praktyczne dla
gościa: klucze dostawców oparte na zmiennych środowiskowych, ścieżkę konfiguracji dostawcy QA live oraz
`CODEX_HOME`, jeśli jest obecne. Zachowaj `--output-dir` w katalogu głównym repozytorium, aby gość
mógł zapisywać z powrotem przez podmontowany obszar roboczy.

## Seedy oparte na repozytorium

Zasoby seedowane znajdują się w `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Są one celowo przechowywane w git, aby plan QA był widoczny zarówno dla ludzi, jak i dla
agenta.

`qa-lab` powinien pozostać generycznym runnerem Markdown. Każdy plik scenariusza Markdown jest
źródłem prawdy dla jednego uruchomienia testowego i powinien definiować:

- metadane scenariusza
- opcjonalne metadane kategorii, możliwości, ścieżki i ryzyka
- odwołania do dokumentacji i kodu
- opcjonalne wymagania Plugin
- opcjonalną łatkę konfiguracji gateway
- wykonywalny `qa-flow`

Powtarzalna powierzchnia runtime, która stoi za `qa-flow`, może pozostać generyczna
i przekrojowa. Na przykład scenariusze Markdown mogą łączyć helpery po stronie
transportu z helperami po stronie przeglądarki, które sterują osadzonym interfejsem Control UI przez
powierzchnię Gateway `browser.request`, bez dodawania runnera specjalnego przypadku.

Pliki scenariuszy powinny być grupowane według możliwości produktu, a nie według folderu
drzewa źródłowego. Zachowuj stabilność ID scenariuszy przy przenoszeniu plików; używaj `docsRefs` i `codeRefs`
dla identyfikowalności implementacji.

Lista bazowa powinna pozostać wystarczająco szeroka, by obejmować:

- czat DM i kanałowy
- zachowanie wątków
- cykl życia akcji na wiadomościach
- wywołania zwrotne Cron
- przywoływanie pamięci
- przełączanie modeli
- przekazanie do subagenta
- odczyt repozytorium i dokumentacji
- jedno małe zadanie build, takie jak Lobster Invaders

## Ścieżki z mockami dostawców

`qa suite` ma dwie lokalne ścieżki z mockami dostawców:

- `mock-openai` to świadomy scenariuszy mock OpenClaw. Pozostaje domyślną
  deterministyczną ścieżką mock dla QA opartego na repozytorium i bramek zgodności.
- `aimock` uruchamia serwer dostawcy oparty na AIMock do eksperymentalnego pokrycia
  protokołu, fixture, record/replay i chaos. Jest dodatkiem i nie zastępuje
  dyspozytora scenariuszy `mock-openai`.

Implementacja ścieżek dostawców znajduje się w `extensions/qa-lab/src/providers/`.
Każdy dostawca zarządza własnymi ustawieniami domyślnymi, uruchamianiem lokalnego serwera, konfiguracją modeli gateway,
potrzebami przygotowania profilu auth oraz flagami możliwości live/mock. Współdzielony kod suite i gateway
powinien routować przez rejestr dostawców zamiast rozgałęziać się według nazw dostawców.

## Adaptery transportu

`qa-lab` zarządza generyczną powierzchnią transportu dla scenariuszy QA Markdown.
`qa-channel` jest pierwszym adapterem na tej powierzchni, ale docelowy projekt jest szerszy:
przyszłe prawdziwe lub syntetyczne kanały powinny podłączać się do tego samego runnera suite
zamiast dodawania runnera QA specyficznego dla transportu.

Na poziomie architektury podział wygląda następująco:

- `qa-lab` zarządza generycznym wykonywaniem scenariuszy, współbieżnością workerów, zapisem artefaktów i raportowaniem.
- adapter transportu zarządza konfiguracją gateway, gotowością, obserwacją ruchu przychodzącego i wychodzącego, akcjami transportu oraz znormalizowanym stanem transportu.
- pliki scenariuszy Markdown w `qa/scenarios/` definiują przebieg testu; `qa-lab` zapewnia powtarzalną powierzchnię runtime, która je wykonuje.

Wskazówki wdrożeniowe dla maintainerów dotyczące nowych adapterów kanałów znajdują się w
[Testing](/pl/help/testing#adding-a-channel-to-qa).

## Raportowanie

`qa-lab` eksportuje raport protokołu Markdown z obserwowanej osi czasu magistrali.
Raport powinien odpowiadać na pytania:

- Co zadziałało
- Co się nie udało
- Co pozostało zablokowane
- Jakie scenariusze uzupełniające warto dodać

Dla sprawdzania charakteru i stylu uruchom ten sam scenariusz na wielu refach modeli live
i zapisz oceniony raport Markdown:

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

Polecenie uruchamia lokalne procesy podrzędne QA gateway, a nie Docker. Scenariusze
character eval powinny ustawiać personę przez `SOUL.md`, a następnie wykonywać zwykłe tury użytkownika,
takie jak czat, pomoc dotycząca workspace i małe zadania na plikach. Kandydacki model
nie powinien być informowany, że jest oceniany. Polecenie zachowuje każdy pełny
transkrypt, rejestruje podstawowe statystyki uruchomienia, a następnie prosi modele oceniające w trybie fast z
rozumowaniem `xhigh` o uszeregowanie uruchomień według naturalności, klimatu i humoru.
Użyj `--blind-judge-models` przy porównywaniu dostawców: prompt sędziego nadal otrzymuje
każdy transkrypt i status uruchomienia, ale refy kandydatów są zastępowane neutralnymi
etykietami takimi jak `candidate-01`; raport mapuje rankingi z powrotem na rzeczywiste refy po
parsowaniu.
Uruchomienia kandydatów domyślnie używają poziomu myślenia `high`, z `xhigh` dla modeli OpenAI,
które to obsługują. Zastąp ustawienie dla konkretnego kandydata inline przez
`--model provider/model,thinking=<level>`. `--thinking <level>` nadal ustawia
globalny fallback, a starsza forma `--model-thinking <provider/model=level>` jest
zachowana dla zgodności.
Refy kandydatów OpenAI domyślnie używają trybu fast, aby tam, gdzie dostawca to obsługuje, wykorzystywane było przetwarzanie priorytetowe. Dodaj inline `,fast`, `,no-fast` lub `,fast=false`, gdy
pojedynczy kandydat lub sędzia wymaga nadpisania. Przekaż `--fast` tylko wtedy, gdy chcesz
wymusić tryb fast dla każdego modelu kandydata. Czasy trwania kandydatów i sędziów są
rejestrowane w raporcie do analizy benchmarków, ale prompty sędziów wyraźnie mówią,
aby nie oceniać według szybkości.
Uruchomienia modeli kandydatów i sędziów domyślnie używają współbieżności 16. Zmniejsz
`--concurrency` lub `--judge-concurrency`, gdy limity dostawcy lub obciążenie lokalnego gateway
sprawiają, że uruchomienie jest zbyt zaszumione.
Gdy nie zostanie przekazany żaden kandydacki `--model`, character eval domyślnie używa
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` oraz
`google/gemini-3.1-pro-preview`, gdy nie zostanie przekazany żaden `--model`.
Gdy nie zostanie przekazany żaden `--judge-model`, sędziowie domyślnie używają
`openai/gpt-5.4,thinking=xhigh,fast` oraz
`anthropic/claude-opus-4-6,thinking=high`.

## Powiązana dokumentacja

- [Testing](/pl/help/testing)
- [QA Channel](/pl/channels/qa-channel)
- [Dashboard](/web/dashboard)
