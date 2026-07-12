---
read_when:
    - Chcesz zrozumieć, jak działa pamięć
    - Chcesz wiedzieć, które pliki pamięci zapisywać
summary: Jak OpenClaw zapamiętuje informacje między sesjami
title: Przegląd pamięci
x-i18n:
    generated_at: "2026-07-12T14:58:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c77d71dd6b1916b923fbf72c373f20128c4f604f96cc76150ea27e0f13a541f8
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw zapamiętuje informacje, zapisując zwykłe pliki Markdown w przestrzeni
roboczej agenta (domyślnie `~/.openclaw/workspace`). Model pamięta tylko to, co
zostanie zapisane na dysku; nie istnieje żaden ukryty stan.

## Jak to działa

Agent ma trzy pliki związane z pamięcią:

- **`MEMORY.md`** — pamięć długoterminowa. Trwałe fakty, preferencje i
  decyzje. Wczytywana na początku sesji.
- **`memory/YYYY-MM-DD.md`** (lub `memory/YYYY-MM-DD-<slug>.md`) — notatki dzienne.
  Bieżący kontekst i obserwacje. Datowane notatki z dzisiaj i wczoraj są
  automatycznie wczytywane po zwykłym `/new` lub `/reset`; warianty z
  identyfikatorem tekstowym, takie jak tworzone przez dołączony hook pamięci
  sesji, są wczytywane razem z plikiem zawierającym wyłącznie datę.
- **`DREAMS.md`** (opcjonalny) — Dziennik snów i podsumowania przebiegów
  Dreaming przeznaczone do weryfikacji przez człowieka, w tym osadzone
  w źródłach wpisy uzupełniające dane historyczne.

<Tip>
Jeśli chcesz, aby agent coś zapamiętał, po prostu go o to poproś: „Zapamiętaj,
że preferuję TypeScript”. Agent zapisze notatkę w odpowiednim pliku.
</Tip>

## Co trafia do którego pliku

`MEMORY.md` jest zwartą, uporządkowaną warstwą: zawiera trwałe fakty,
preferencje, obowiązujące decyzje i krótkie podsumowania, które powinny być
dostępne na początku sesji. Nie jest to surowy zapis rozmowy, dziennik ani
kompletne archiwum.

Pliki `memory/YYYY-MM-DD.md` stanowią warstwę roboczą: zawierają szczegółowe
notatki dzienne, obserwacje, podsumowania sesji i surowy kontekst, który może
nadal przydać się później. Są indeksowane na potrzeby `memory_search` i
`memory_get`, ale nie są umieszczane w początkowym prompcie przy każdej turze.

Z czasem agent wyodrębnia przydatne informacje z notatek dziennych i przenosi
je do `MEMORY.md`, a także usuwa nieaktualne wpisy długoterminowe. Wygenerowane
instrukcje przestrzeni roboczej i przepływ Heartbeat wykonują te czynności
okresowo; nie musisz ręcznie edytować `MEMORY.md` przy każdym szczególe.

Jeśli rozmiar `MEMORY.md` przekroczy limit pliku początkowego, OpenClaw
pozostawi cały plik na dysku, ale skróci kopię umieszczaną w kontekście.
Potraktuj to jako sygnał, aby przenieść szczegółowe informacje do
`memory/*.md`, pozostawić w `MEMORY.md` wyłącznie trwałe podsumowanie albo
zwiększyć limity początkowe, jeśli chcesz przeznaczyć większy budżet promptu.
Użyj `/context list`, `/context detail` lub `openclaw doctor`, aby zobaczyć
rozmiary surowe i umieszczone w kontekście oraz stan skrócenia.

## Wspomnienia wpływające na działania

Większość wspomnień to zwykłe notatki Markdown. Niektóre wpływają jednak na to,
co agent powinien zrobić później; w takich przypadkach zapisz nie tylko sam
fakt, lecz także informację, kiedy można bezpiecznie podjąć na jego podstawie
działanie.

Zapisz tę granicę działania, gdy notatka dotyczy:

- wymagań dotyczących zatwierdzenia lub uprawnień,
- tymczasowych ograniczeń,
- przekazania zadania do innej sesji, wątku lub osoby,
- warunków wygaśnięcia,
- momentu, od którego działanie jest bezpieczne,
- uprawnień źródła lub właściciela,
- instrukcji, aby powstrzymać się od kuszącego działania.

Przydatne wspomnienie wpływające na działania jasno określa:

- co zmienia przyszłe zachowanie,
- kiedy lub pod jakim warunkiem ma zastosowanie,
- kiedy wygasa albo co umożliwia podjęcie działania,
- czego agent powinien unikać,
- kto jest źródłem lub właścicielem, jeśli wpływa to na zaufanie lub
  uprawnienia.

Pamięć może zachować kontekst zatwierdzenia, ale nie egzekwuje zasad. Do
twardych mechanizmów kontroli operacyjnej używaj ustawień zatwierdzania
OpenClaw, piaskownicy i zaplanowanych zadań.

Przykład:

```md
Migracja API jest projektowana w innej sesji. W przyszłych turach nie należy
edytować implementacji API z tego wątku; ustalenia z tego miejsca mogą służyć
wyłącznie jako dane wejściowe do projektu, dopóki plan migracji nie zostanie
wdrożony.
```

Inny przykład:

```md
Raport z niezaufanego źródła wymaga weryfikacji przed zatwierdzeniem. W
przyszłych turach należy traktować go wyłącznie jako materiał dowodowy; nie
należy zapisywać go jako trwałej pamięci, dopóki zaufany recenzent nie
potwierdzi jego zawartości.
```

Nie jest to wymagany schemat każdego wspomnienia; proste fakty mogą pozostać
zwięzłe. Używaj granic wpływających na działania, gdy utrata informacji o
czasie, uprawnieniach, wygaśnięciu lub warunkach bezpiecznego działania mogłaby
sprawić, że agent zrobi później coś niewłaściwego.

Do wywnioskowanych, krótkotrwałych działań następczych używaj
[zobowiązań](/pl/concepts/commitments). Do dokładnych przypomnień, kontroli
wykonywanych w określonym czasie i cyklicznych zadań używaj
[zaplanowanych zadań](/pl/automation/cron-jobs). Pamięć może nadal podsumowywać
trwały kontekst związany z każdą z tych ścieżek.

## Wywnioskowane zobowiązania

Niektóre przyszłe działania następcze nie są trwałymi faktami. Jeśli wspomnisz
o jutrzejszej rozmowie kwalifikacyjnej, przydatnym wspomnieniem może być
„zapytaj po rozmowie, jak poszło”, a nie „zapisz to na zawsze w `MEMORY.md`”.

[Zobowiązania](/pl/concepts/commitments) to opcjonalne, krótkotrwałe wspomnienia
dotyczące działań następczych przeznaczone do takich przypadków. OpenClaw
wnioskuje je w ukrytym przebiegu w tle, ogranicza do tego samego agenta i
kanału oraz dostarcza odpowiednie wiadomości kontrolne za pośrednictwem
Heartbeat. Jawne przypomnienia nadal korzystają z
[zaplanowanych zadań](/pl/automation/cron-jobs).

## Narzędzia pamięci

Agent ma dwa narzędzia do pracy z pamięcią:

- **`memory_search`** — znajduje odpowiednie notatki za pomocą wyszukiwania
  semantycznego, nawet jeśli ich sformułowanie różni się od oryginału.
- **`memory_get`** — odczytuje określony plik pamięci lub zakres wierszy.

Oba narzędzia udostępnia aktywny plugin pamięci (domyślnie: `memory-core`).

## Wyszukiwanie w pamięci

Gdy skonfigurowany jest dostawca embeddingów, `memory_search` korzysta z
wyszukiwania hybrydowego: podobieństwo wektorowe (znaczenie semantyczne) jest
łączone z dopasowywaniem słów kluczowych (dokładnych terminów, takich jak
identyfikatory i symbole kodu). Działa to od razu po podaniu klucza API
dowolnego obsługiwanego dostawcy.

<Info>
OpenClaw domyślnie korzysta z embeddingów OpenAI. Ustaw jawnie
`agents.defaults.memorySearch.provider`, aby używać Gemini, Voyage, Mistral,
Bedrock, DeepInfra, lokalnego GGUF, Ollama, LM Studio, GitHub Copilot lub
ogólnego punktu końcowego zgodnego z OpenAI.
</Info>

Zobacz [Wyszukiwanie w pamięci](/pl/concepts/memory-search), aby dowiedzieć się,
jak działa wyszukiwanie, jakie są opcje dostrajania i jak skonfigurować
dostawcę.

## Mechanizmy przechowywania pamięci

<CardGroup cols={3}>
<Card title="Wbudowany (domyślny)" icon="database" href="/pl/concepts/memory-builtin">
Oparty na SQLite. Działa od razu z wyszukiwaniem słów kluczowych,
podobieństwem wektorowym i wyszukiwaniem hybrydowym. Bez dodatkowych zależności.
</Card>
<Card title="QMD" icon="search" href="/pl/concepts/memory-qmd">
Lokalny proces pomocniczy z ponownym rankingiem, rozszerzaniem zapytań i
możliwością indeksowania katalogów spoza przestrzeni roboczej.
</Card>
<Card title="Honcho" icon="brain" href="/pl/concepts/memory-honcho">
Natywna dla AI pamięć między sesjami z modelowaniem użytkownika, wyszukiwaniem
semantycznym i świadomością wielu agentów. Wymaga instalacji pluginu.
</Card>
<Card title="LanceDB" icon="layers" href="/pl/plugins/memory-lancedb">
Pamięć oparta na LanceDB, z embeddingami zgodnymi z OpenAI, automatycznym
przywoływaniem, automatycznym zapisywaniem i obsługą lokalnych embeddingów
Ollama. Wymaga instalacji pluginu.
</Card>
</CardGroup>

## Warstwa wiki wiedzy

Jeśli chcesz, aby trwała pamięć działała bardziej jak utrzymywana baza wiedzy
niż surowe notatki, użyj dołączonego pluginu `memory-wiki`. Kompiluje on trwałą
wiedzę do repozytorium wiki z deterministyczną strukturą stron,
ustrukturyzowanymi twierdzeniami i dowodami, śledzeniem sprzeczności i
aktualności, generowanymi pulpitami, skompilowanymi zestawieniami oraz
natywnymi narzędziami wiki (`wiki_status`, `wiki_search`, `wiki_get`,
`wiki_apply`, `wiki_lint`).

`memory-wiki` nie zastępuje aktywnego pluginu pamięci; aktywny plugin pamięci
nadal odpowiada za przywoływanie, promowanie i Dreaming. `memory-wiki` dodaje
obok niego warstwę wiedzy bogatą w informacje o pochodzeniu.

<CardGroup cols={1}>
<Card title="Wiki pamięci" icon="book" href="/pl/plugins/memory-wiki">
Kompiluje trwałą pamięć do repozytorium wiki bogatego w informacje o
pochodzeniu, z twierdzeniami, pulpitami, trybem pomostowym i przepływami pracy
przyjaznymi dla Obsidian.
</Card>
</CardGroup>

## Automatyczne opróżnianie pamięci

Zanim [Compaction](/pl/concepts/compaction) podsumuje rozmowę, OpenClaw wykonuje
cichą turę, która przypomina agentowi o zapisaniu ważnego kontekstu w plikach
pamięci. Funkcja jest domyślnie włączona; ustaw
`agents.defaults.compaction.memoryFlush.enabled: false`, aby ją wyłączyć.

Aby ta porządkowa tura korzystała z modelu lokalnego, ustaw dokładne
nadpisanie obowiązujące wyłącznie dla tury opróżniania pamięci (nie dziedziczy
ona łańcucha modeli rezerwowych aktywnej sesji):

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

<Tip>
Opróżnianie pamięci zapobiega utracie kontekstu podczas Compaction. Jeśli
rozmowa zawiera ważne fakty, których agent nie zapisał jeszcze w pliku,
zostaną one automatycznie zapisane przed utworzeniem podsumowania.
</Tip>

## Dreaming

Dreaming to opcjonalny proces konsolidacji pamięci wykonywany w tle. Zbiera
krótkoterminowe sygnały przywoływania, ocenia kandydatów i promuje do pamięci
długoterminowej (`MEMORY.md`) wyłącznie zakwalifikowane elementy:

- **Opcjonalny**: domyślnie wyłączony.
- **Zaplanowany**: po włączeniu `memory-core` automatycznie zarządza jednym
  cyklicznym zadaniem Cron wykonującym pełny przebieg Dreaming.
- **Progowy**: promowane elementy muszą przejść kryteria wyniku,
  częstotliwości przywoływania i różnorodności zapytań.
- **Możliwy do weryfikacji**: podsumowania faz i wpisy dziennika są
  zapisywane w `DREAMS.md` do weryfikacji przez człowieka.

Zobacz [Dreaming](/pl/concepts/dreaming), aby poznać zachowanie poszczególnych
faz, sygnały oceny i szczegóły Dziennika snów.

## Osadzone uzupełnianie danych i promowanie na bieżąco

System Dreaming ma dwie powiązane ścieżki weryfikacji:

- **Dreaming na bieżąco** korzysta z krótkoterminowego magazynu Dreaming w
  `memory/.dreams/` i jest używany przez zwykłą fazę głęboką do podejmowania
  decyzji, które elementy trafią do `MEMORY.md`.
- **Osadzone uzupełnianie danych** odczytuje historyczne notatki
  `memory/YYYY-MM-DD.md` jako samodzielne pliki dni i zapisuje
  ustrukturyzowane wyniki weryfikacji w `DREAMS.md`.

Osadzone uzupełnianie danych przydaje się do ponownego przetwarzania starszych
notatek i sprawdzania, które informacje system uznaje za trwałe, bez ręcznego
edytowania `MEMORY.md`.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Flaga `--stage-short-term` umieszcza osadzonych kandydatów do trwałej pamięci
w tym samym krótkoterminowym magazynie Dreaming, którego używa już zwykła faza
głęboka; nie promuje ich bezpośrednio. W rezultacie:

- `DREAMS.md` pozostaje obszarem weryfikacji przeznaczonym dla człowieka.
- Magazyn krótkoterminowy pozostaje obszarem rankingu przeznaczonym dla
  maszyny.
- `MEMORY.md` jest nadal zapisywany wyłącznie przez głębokie promowanie.

Aby cofnąć ponowne przetwarzanie bez modyfikowania zwykłych wpisów dziennika
ani normalnego stanu przywoływania:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Sprawdź stan indeksu i dostawcę
openclaw memory search "query"  # Wyszukaj z wiersza poleceń
openclaw memory index --force   # Przebuduj indeks
```

## Dalsza lektura

- [Wyszukiwanie w pamięci](/pl/concepts/memory-search): potok wyszukiwania, dostawcy i dostrajanie.
- [Wbudowany mechanizm pamięci](/pl/concepts/memory-builtin): domyślny mechanizm oparty na SQLite.
- [Mechanizm pamięci QMD](/pl/concepts/memory-qmd): zaawansowany lokalny proces pomocniczy.
- [Pamięć Honcho](/pl/concepts/memory-honcho): natywna dla AI pamięć między sesjami.
- [Pamięć LanceDB](/pl/plugins/memory-lancedb): plugin oparty na LanceDB z embeddingami zgodnymi z OpenAI.
- [Wiki pamięci](/pl/plugins/memory-wiki): skompilowane repozytorium wiedzy i natywne narzędzia wiki.
- [Dreaming](/pl/concepts/dreaming): promowanie w tle z krótkoterminowego przywoływania do pamięci długoterminowej.
- [Dokumentacja konfiguracji pamięci](/pl/reference/memory-config): wszystkie ustawienia konfiguracji.
- [Compaction](/pl/concepts/compaction): interakcje między Compaction a pamięcią.
- [Active Memory](/pl/concepts/active-memory): pamięć podagentów dla interaktywnych sesji czatu.
