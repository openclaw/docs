---
read_when:
    - Rozszerzanie qa-lab lub qa-channel
    - Dodawanie scenariuszy QA opartych na repozytorium
    - Budowanie bardziej realistycznej automatyzacji QA wokół dashboardu Gateway
summary: Prywatna struktura automatyzacji QA dla qa-lab, qa-channel, scenariuszy seedowanych i raportów protokołu
title: Automatyzacja QA E2E
x-i18n:
    generated_at: "2026-04-24T09:06:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: bbde51169a1572dc6753ab550ca29ca98abb2394e8991a8482bd7b66ea80ce76
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

Prywatny stos QA ma ćwiczyć OpenClaw w bardziej realistyczny,
kanałowy sposób niż pojedynczy test jednostkowy.

Obecne elementy:

- `extensions/qa-channel`: syntetyczny kanał wiadomości z powierzchniami DM, kanału, wątku,
  reakcji, edycji i usuwania.
- `extensions/qa-lab`: UI debuggera i magistrala QA do obserwowania transkryptu,
  wstrzykiwania wiadomości przychodzących i eksportowania raportu Markdown.
- `qa/`: zasoby seedowane oparte na repozytorium dla zadania kickoff i bazowych
  scenariuszy QA.

Obecny przepływ pracy operatora QA to witryna QA z dwoma panelami:

- Lewy: dashboard Gateway (Control UI) z agentem.
- Prawy: QA Lab, pokazujący transkrypt w stylu Slack i plan scenariusza.

Uruchom ją za pomocą:

```bash
pnpm qa:lab:up
```

To buduje witrynę QA, uruchamia ścieżkę gateway opartą na Dockerze i udostępnia
stronę QA Lab, na której operator albo pętla automatyzacji może zlecić agentowi
misję QA, obserwować rzeczywiste zachowanie kanału i zapisywać, co zadziałało, co
się nie udało albo co pozostało zablokowane.

Aby szybciej iterować nad UI QA Lab bez przebudowywania obrazu Docker przy każdej zmianie,
uruchom stos z bundłem QA Lab montowanym przez bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` utrzymuje usługi Docker na wcześniej zbudowanym obrazie i montuje przez bind mount
`extensions/qa-lab/web/dist` do kontenera `qa-lab`. `qa:lab:watch`
przebudowuje ten bundel przy zmianach, a przeglądarka automatycznie się przeładowuje, gdy hash zasobu QA Lab się zmieni.

Dla ścieżki smoke Matrix z rzeczywistym transportem uruchom:

```bash
pnpm openclaw qa matrix
```

Ta ścieżka tworzy jednorazowy homeserver Tuwunel w Dockerze, rejestruje
tymczasowych użytkowników driver, SUT i observer, tworzy jeden prywatny pokój, a następnie uruchamia
rzeczywisty Plugin Matrix wewnątrz podrzędnego QA gateway. Ścieżka transportu na żywo utrzymuje
konfigurację podrzędną ograniczoną do testowanego transportu, więc Matrix działa bez
`qa-channel` w konfiguracji podrzędnej. Zapisuje ustrukturyzowane artefakty raportu i
połączony log stdout/stderr do wybranego katalogu wyjściowego Matrix QA. Aby
przechwycić także zewnętrzne wyjście builda/launchera `scripts/run-node.mjs`, ustaw
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` na plik logu lokalny dla repozytorium.

Dla ścieżki smoke Telegram z rzeczywistym transportem uruchom:

```bash
pnpm openclaw qa telegram
```

Ta ścieżka kieruje ruch do jednej rzeczywistej prywatnej grupy Telegram zamiast tworzyć
jednorazowy serwer. Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` i
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, plus dwóch różnych botów w tej samej
prywatnej grupie. Bot SUT musi mieć nazwę użytkownika Telegram, a obserwacja bot-do-bot
działa najlepiej, gdy oba boty mają włączony tryb Bot-to-Bot Communication Mode
w `@BotFather`.
Polecenie kończy się kodem niezerowym, gdy którykolwiek scenariusz zawiedzie. Użyj `--allow-failures`, gdy
chcesz uzyskać artefakty bez kończenia z błędnym kodem wyjścia.
Raport i podsumowanie Telegram zawierają RTT per odpowiedź od żądania
wysłania wiadomości drivera do zaobserwowanej odpowiedzi SUT, zaczynając od canary.

Dla ścieżki smoke Discord z rzeczywistym transportem uruchom:

```bash
pnpm openclaw qa discord
```

Ta ścieżka kieruje ruch do jednego rzeczywistego prywatnego kanału guild Discord z dwoma botami: botem
driver sterowanym przez harness i botem SUT uruchamianym przez podrzędny
gateway OpenClaw za pośrednictwem dołączonego Pluginu Discord. Wymaga
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
oraz `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` przy użyciu poświadczeń env.
Ścieżka weryfikuje obsługę wzmianek kanału i sprawdza, czy bot SUT
zarejestrował natywne polecenie `/help` w Discord.
Polecenie kończy się kodem niezerowym, gdy którykolwiek scenariusz zawiedzie. Użyj `--allow-failures`, gdy
chcesz uzyskać artefakty bez kończenia z błędnym kodem wyjścia.

Ścieżki transportu na żywo współdzielą teraz jeden mniejszy kontrakt zamiast tworzyć
własny kształt listy scenariuszy dla każdej z nich:

`qa-channel` pozostaje szerokim syntetycznym zestawem zachowań produktu i nie jest częścią
macierzy pokrycia transportów na żywo.

| Ścieżka  | Canary | Bramkowanie wzmianką | Blokada allowlist | Odpowiedź najwyższego poziomu | Wznowienie po restarcie | Dalszy ciąg wątku | Izolacja wątku | Obserwacja reakcji | Polecenie help | Rejestracja natywnego polecenia |
| -------- | ------ | -------------------- | ----------------- | ----------------------------- | ----------------------- | ----------------- | -------------- | ------------------ | -------------- | ------------------------------- |
| Matrix   | x      | x                    | x                 | x                             | x                       | x                 | x              | x                  |                |                                 |
| Telegram | x      | x                    |                   |                               |                         |                   |                |                    | x              |                                 |
| Discord  | x      | x                    |                   |                               |                         |                   |                |                    |                | x                               |

To utrzymuje `qa-channel` jako szeroki zestaw zachowań produktu, podczas gdy Matrix,
Telegram i przyszłe transporty na żywo współdzielą jedną jawną checklistę kontraktu transportowego.

Dla jednorazowej ścieżki z Linux VM bez wprowadzania Dockera do ścieżki QA uruchom:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

To uruchamia świeżego gościa Multipass, instaluje zależności, buduje OpenClaw
wewnątrz gościa, uruchamia `qa suite`, a następnie kopiuje zwykły raport QA i
podsumowanie z powrotem do `.artifacts/qa-e2e/...` na hoście.
Ponownie używa tego samego zachowania wyboru scenariuszy co `qa suite` na hoście.
Uruchomienia hosta i Multipass suite domyślnie wykonują wiele wybranych scenariuszy równolegle
z izolowanymi workerami gateway. `qa-channel` domyślnie używa współbieżności 4,
ograniczonej liczbą wybranych scenariuszy. Użyj `--concurrency <count>`, aby dostroić
liczbę workerów, albo `--concurrency 1` dla wykonania seryjnego.
Polecenie kończy się kodem niezerowym, gdy którykolwiek scenariusz zawiedzie. Użyj `--allow-failures`, gdy
chcesz uzyskać artefakty bez kończenia z błędnym kodem wyjścia.
Uruchomienia na żywo przekazują obsługiwane wejścia uwierzytelniania QA, które są praktyczne dla
gościa: klucze dostawców oparte na env, ścieżkę konfiguracji QA live provider i
`CODEX_HOME`, gdy jest obecne. Zachowaj `--output-dir` pod katalogiem głównym repozytorium, aby gość
mógł zapisywać z powrotem przez zamontowany workspace.

## Seedy oparte na repozytorium

Zasoby seedowane znajdują się w `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Celowo są w git, aby plan QA był widoczny zarówno dla ludzi, jak i dla
agenta.

`qa-lab` powinno pozostać generycznym runnerem Markdown. Każdy plik scenariusza Markdown jest
źródłem prawdy dla jednego uruchomienia testowego i powinien definiować:

- metadane scenariusza
- opcjonalne metadane kategorii, możliwości, ścieżki i ryzyka
- odwołania do dokumentacji i kodu
- opcjonalne wymagania Pluginów
- opcjonalną łatkę konfiguracji gateway
- wykonywalny `qa-flow`

Wielokrotnego użytku powierzchnia runtime wspierająca `qa-flow` może pozostać generyczna
i przekrojowa. Na przykład scenariusze Markdown mogą łączyć helpery po stronie
transportu z helperami po stronie przeglądarki, które sterują osadzonym Control UI przez
łącze Gateway `browser.request`, bez dodawania runnera specjalnie dla danego przypadku.

Pliki scenariuszy powinny być grupowane według możliwości produktu, a nie folderu drzewa
źródeł. Zachowuj stabilne identyfikatory scenariuszy przy przenoszeniu plików; używaj `docsRefs` i `codeRefs`
dla identyfikowalności implementacji.

Lista bazowa powinna pozostać wystarczająco szeroka, aby obejmować:

- czat DM i kanałowy
- zachowanie wątków
- cykl życia akcji wiadomości
- callbacki Cron
- przypominanie pamięci
- przełączanie modeli
- handoff subagentów
- czytanie repozytorium i dokumentacji
- jedno małe zadanie builda, takie jak Lobster Invaders

## Ścieżki mock dostawców

`qa suite` ma dwie lokalne ścieżki mock dostawców:

- `mock-openai` to świadomy scenariuszy mock OpenClaw. Pozostaje domyślną
  deterministyczną ścieżką mock dla QA opartego na repozytorium i bramek parzystości.
- `aimock` uruchamia serwer dostawcy oparty na AIMock dla eksperymentalnego pokrycia protokołu,
  fixture, record/replay i chaos. Jest dodatkiem i nie zastępuje dispatcher-a scenariuszy `mock-openai`.

Implementacja ścieżek dostawców znajduje się w `extensions/qa-lab/src/providers/`.
Każdy dostawca zarządza swoimi ustawieniami domyślnymi, uruchamianiem lokalnego serwera,
konfiguracją modelu gateway, potrzebami przygotowania auth-profile oraz flagami możliwości live/mock. Wspólny kod suite i gateway powinien kierować ruch przez rejestr dostawców zamiast rozgałęziać się po nazwach dostawców.

## Adaptery transportu

`qa-lab` zarządza generycznym łączem transportowym dla scenariuszy Markdown QA.
`qa-channel` jest pierwszym adapterem na tym łączu, ale docelowy projekt jest szerszy:
przyszłe rzeczywiste lub syntetyczne kanały powinny podłączać się do tego samego runnera suite
zamiast dodawać runner QA specyficzny dla transportu.

Na poziomie architektury podział wygląda następująco:

- `qa-lab` zarządza generycznym wykonywaniem scenariuszy, współbieżnością workerów, zapisem artefaktów i raportowaniem.
- adapter transportu zarządza konfiguracją gateway, gotowością, obserwacją ruchu przychodzącego i wychodzącego, akcjami transportu i znormalizowanym stanem transportu.
- pliki scenariuszy Markdown w `qa/scenarios/` definiują uruchomienie testu; `qa-lab` udostępnia wielokrotnego użytku powierzchnię runtime, która je wykonuje.

Wskazówki adopcyjne dla maintainerów dotyczące nowych adapterów kanałów znajdują się w
[Testowaniu](/pl/help/testing#adding-a-channel-to-qa).

## Raportowanie

`qa-lab` eksportuje raport protokołu Markdown z obserwowanej osi czasu magistrali.
Raport powinien odpowiadać na pytania:

- Co zadziałało
- Co się nie udało
- Co pozostało zablokowane
- Jakie scenariusze uzupełniające warto dodać

Dla kontroli charakteru i stylu uruchom ten sam scenariusz na wielu model refs na żywo
i zapisz oceniony raport Markdown:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=medium,fast \
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

Polecenie uruchamia lokalne podrzędne procesy QA gateway, a nie Docker. Scenariusze character eval
powinny ustawiać personę przez `SOUL.md`, a następnie uruchamiać zwykłe tury użytkownika,
takie jak czat, pomoc dotyczącą workspace i małe zadania na plikach. Modelowi kandydującemu
nie należy mówić, że jest oceniany. Polecenie zachowuje każdy pełny
transkrypt, rejestruje podstawowe statystyki uruchomienia, a następnie prosi modele oceniające w trybie fast z
rozumowaniem `xhigh`, gdzie jest obsługiwane, o uszeregowanie uruchomień według naturalności, klimatu i humoru.
Użyj `--blind-judge-models` przy porównywaniu dostawców: prompt oceniający nadal otrzymuje
każdy transkrypt i status uruchomienia, ale odwołania kandydatów są zastępowane neutralnymi
etykietami takimi jak `candidate-01`; raport mapuje rankingi z powrotem na rzeczywiste odwołania po
parsowaniu.
Uruchomienia kandydatów domyślnie używają rozumowania `high`, z `medium` dla GPT-5.4 i `xhigh`
dla starszych odwołań ewaluacyjnych OpenAI, które to obsługują. Nadpisz konkretnego kandydata inline przez
`--model provider/model,thinking=<level>`. `--thinking <level>` nadal ustawia
globalny fallback, a starsza forma `--model-thinking <provider/model=level>` jest
zachowana dla kompatybilności.
Odwołania kandydatów OpenAI domyślnie używają trybu fast, aby korzystać z przetwarzania priorytetowego tam,
gdzie dostawca to obsługuje. Dodaj inline `,fast`, `,no-fast` albo `,fast=false`, gdy pojedynczy
kandydat albo sędzia potrzebuje nadpisania. Przekaż `--fast` tylko wtedy, gdy chcesz
wymusić tryb fast dla każdego modelu kandydującego. Czasy trwania kandydatów i sędziów są
rejestrowane w raporcie do analizy benchmarków, ale prompty sędziowskie wyraźnie mówią,
aby nie ustawiać rankingu według szybkości.
Uruchomienia modeli kandydatów i sędziów domyślnie używają współbieżności 16. Zmniejsz
`--concurrency` albo `--judge-concurrency`, gdy limity dostawcy albo obciążenie lokalnego gateway
powodują, że uruchomienie staje się zbyt zaszumione.
Gdy nie zostanie przekazany żaden kandydat `--model`, character eval domyślnie używa
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` oraz
`google/gemini-3.1-pro-preview`, gdy nie przekazano `--model`.
Gdy nie zostanie przekazany `--judge-model`, sędziowie domyślnie używają
`openai/gpt-5.4,thinking=xhigh,fast` oraz
`anthropic/claude-opus-4-6,thinking=high`.

## Powiązana dokumentacja

- [Testowanie](/pl/help/testing)
- [QA Channel](/pl/channels/qa-channel)
- [Dashboard](/pl/web/dashboard)
