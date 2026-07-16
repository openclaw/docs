---
read_when:
    - Chcesz zrozumieć, jak działa pamięć
    - Chcesz wiedzieć, które pliki pamięci zapisać
summary: Jak OpenClaw zapamiętuje informacje między sesjami
title: Przegląd pamięci
x-i18n:
    generated_at: "2026-07-16T18:14:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 22542c5df22f1602c89bae05760a5418224d8ee1f1a73679203dec9b2f091f2a
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw zapamiętuje informacje, zapisując zwykłe pliki Markdown w obszarze
roboczym agenta (domyślnie `~/.openclaw/workspace`). Model pamięta tylko to, co
zostanie zapisane na dysku; nie istnieje żaden ukryty stan.

## Jak to działa

Agent ma trzy pliki związane z pamięcią:

- **`MEMORY.md`** — pamięć długoterminowa. Trwałe fakty, preferencje i
  decyzje. Wczytywana na początku sesji.
- **`memory/YYYY-MM-DD.md`** (lub `memory/YYYY-MM-DD-<slug>.md`) — notatki dzienne.
  Bieżący kontekst i obserwacje. Datowane notatki z dzisiaj i wczoraj są
  automatycznie wczytywane przy samym `/new` lub `/reset`; warianty ze slugiem, na przykład
  zapisywane przez dołączony hook pamięci sesji, są pobierane razem z plikiem
  zawierającym wyłącznie datę.
- **`DREAMS.md`** (opcjonalnie) — Dziennik snów i podsumowania przebiegów Dreaming
  do weryfikacji przez człowieka, w tym ugruntowane wpisy historycznego uzupełniania danych.

<Tip>
Aby agent coś zapamiętał, wystarczy go o to poprosić: „Zapamiętaj, że
preferuję TypeScript”. Agent zapisze notatkę w odpowiednim pliku.
</Tip>

## Co trafia dokąd

`MEMORY.md` to zwięzła, starannie dobrana warstwa: trwałe fakty, preferencje, stałe
decyzje i krótkie podsumowania, które powinny być dostępne na początku
sesji. Nie jest to surowa transkrypcja, dziennik ani kompletne archiwum.

Pliki `memory/YYYY-MM-DD.md` stanowią warstwę roboczą: szczegółowe notatki dzienne,
obserwacje, podsumowania sesji i surowy kontekst, który może być przydatny
później. Są indeksowane na potrzeby `memory_search` i `memory_get`, ale nie są
dołączane do początkowego promptu przy każdej turze.

Z czasem agent wyodrębnia przydatne materiały z notatek dziennych do
`MEMORY.md` i usuwa nieaktualne wpisy długoterminowe. Wygenerowane instrukcje
obszaru roboczego i przepływ Heartbeat wykonują to okresowo; nie trzeba
ręcznie edytować `MEMORY.md` dla każdego szczegółu.

Jeśli `MEMORY.md` przekroczy budżet plików początkowych, OpenClaw zachowuje plik na
dysku w całości, ale skraca kopię dołączaną do kontekstu. Należy potraktować
to jako sygnał, aby przenieść szczegółowy materiał do `memory/*.md`, pozostawić
w `MEMORY.md` tylko trwałe podsumowanie albo zwiększyć limity początkowe, jeśli
akceptowalne jest większe zużycie budżetu promptu. Aby sprawdzić rozmiary surowe
i dołączane oraz stan skrócenia, użyj `/context list`, `/context detail` lub `openclaw doctor`.

## Importowanie z asystentów programistycznych

Interfejs Control UI może importować istniejącą pamięć lokalną z Codex i Claude Code.
Otwórz **Settings** → **Import Memory**, wybierz agenta docelowego, sprawdź
wykryte pliki i potwierdź import. OpenClaw kopiuje wyłącznie pamięć w formacie Markdown:

- Codex: skonsolidowane pliki `MEMORY.md` i `memory_summary.md` w
  `~/.codex/memories` (lub `CODEX_HOME/memories`). Surowe pliki przebiegów i transkrypcji
  nie są importowane.
- Claude Code: pliki Markdown z katalogu automatycznej pamięci każdego projektu w
  `~/.claude/projects/*/memory` oraz skonfigurowany przez użytkownika
  `autoMemoryDirectory`, jeśli istnieje. Instrukcje projektów, sesje, ustawienia
  i dane uwierzytelniające nie są objęte tą operacją dotyczącą wyłącznie pamięci.

Zaimportowane pliki pozostają oddzielne w `memory/imports/codex/` i
`memory/imports/claude-code/` w obszarze roboczym wybranego agenta. Są indeksowane
na potrzeby `memory_search` i dostępne za pośrednictwem `memory_get`; nie są scalane
z początkowym plikiem `MEMORY.md` agenta. Pliki źródłowe pozostają niezmienione.

Podgląd oznacza konflikty w miejscu docelowym. Włącz **Replace existing imports**, aby
zastąpić te pliki; zastosowanie zmian tworzy zweryfikowaną kopię zapasową sprzed importu
i zachowuje w raporcie migracji kopie poszczególnych zastąpionych plików.

## Wspomnienia wpływające na działania

Większość wspomnień to zwykłe notatki Markdown. Niektóre wpływają na to, co agent
powinien zrobić później; w takich przypadkach należy zapisać nie tylko sam fakt,
lecz także informację, kiedy można bezpiecznie podjąć na jego podstawie działanie.

Należy zapisać tę granicę działania, gdy notatka dotyczy:

- wymagań dotyczących zatwierdzenia lub uprawnień,
- ograniczeń tymczasowych,
- przekazania zadania do innej sesji, wątku lub osoby,
- warunków wygaśnięcia,
- bezpiecznego momentu podjęcia działania,
- uprawnień źródła lub właściciela,
- instrukcji, aby powstrzymać się od kuszącego działania.

Przydatne wspomnienie wpływające na działania jasno określa:

- co zmienia przyszłe zachowanie,
- kiedy lub pod jakim warunkiem ma zastosowanie,
- kiedy wygasa lub co umożliwia podjęcie działania,
- czego agent powinien unikać,
- kto jest źródłem lub właścicielem, jeśli wpływa to na zaufanie lub uprawnienia.

Pamięć może zachowywać kontekst zatwierdzenia, ale nie wymusza zasad. Do
ścisłej kontroli operacyjnej należy używać ustawień zatwierdzania OpenClaw,
izolacji sandbox oraz zaplanowanych zadań.

Przykład:

```md
Migracja API jest projektowana w innej sesji. W przyszłych turach nie należy
edytować implementacji API z poziomu tego wątku; ustalenia stąd należy
traktować wyłącznie jako dane wejściowe do projektu, dopóki plan migracji nie zostanie przyjęty.
```

Inny przykład:

```md
Raport z niezaufanego źródła wymaga weryfikacji przed zatwierdzeniem. W przyszłych turach
należy traktować go wyłącznie jako materiał dowodowy; nie należy zapisywać go jako trwałej pamięci, dopóki
zaufany weryfikator nie potwierdzi zawartości.
```

Nie jest to schemat wymagany dla każdego wspomnienia; proste fakty mogą pozostać zwięzłe.
Granice działań należy stosować, gdy utrata kontekstu czasu, uprawnień, wygaśnięcia lub
bezpiecznego momentu działania mogłaby później spowodować niewłaściwe działanie agenta.

Dla wywnioskowanych, krótkotrwałych działań następczych użyj [zobowiązań](/pl/concepts/commitments).
Dla dokładnych przypomnień, kontroli czasowych i cyklicznych prac użyj
[zaplanowanych zadań](/pl/automation/cron-jobs). Pamięć może nadal podsumowywać trwały
kontekst dotyczący obu tych ścieżek.

## Wywnioskowane zobowiązania

Niektóre przyszłe działania następcze nie są trwałymi faktami. Jeśli wspomniana zostanie rozmowa
kwalifikacyjna jutro, przydatnym wspomnieniem może być „odezwij się po rozmowie”, a nie „przechowuj
to na zawsze w `MEMORY.md`”.

[Zobowiązania](/pl/concepts/commitments) to opcjonalne, krótkotrwałe wspomnienia
o działaniach następczych przeznaczone do takich przypadków. OpenClaw wywnioskuje je w ukrytym procesie w tle,
ogranicza je do tego samego agenta i kanału oraz dostarcza należne wiadomości kontrolne za pomocą
Heartbeat. Jawne przypomnienia nadal korzystają z [zaplanowanych zadań](/pl/automation/cron-jobs).

## Narzędzia pamięci

Agent ma dwa narzędzia do pracy z pamięcią:

- **`memory_search`** — wyszukuje odpowiednie notatki semantycznie, nawet jeśli
  ich sformułowanie różni się od oryginalnego.
- **`memory_get`** — odczytuje określony plik pamięci lub zakres wierszy.

Oba narzędzia udostępnia aktywny plugin pamięci (domyślnie: `memory-core`).

## Wyszukiwanie w pamięci

Po skonfigurowaniu dostawcy osadzeń `memory_search` używa wyszukiwania hybrydowego:
podobieństwa wektorowego (znaczenia semantycznego) połączonego z dopasowywaniem słów kluczowych (dokładnych
terminów, takich jak identyfikatory i symbole kodu). Działa to bez dodatkowej konfiguracji po podaniu klucza API
dowolnego obsługiwanego dostawcy.

<Info>
OpenClaw domyślnie używa osadzeń OpenAI. Ustaw jawnie
`agents.defaults.memorySearch.provider`, aby używać Gemini, Voyage,
Mistral, Bedrock, DeepInfra, lokalnego GGUF, Ollama, LM Studio, GitHub Copilot lub
ogólnego punktu końcowego zgodnego z OpenAI.
</Info>

Zobacz [Wyszukiwanie w pamięci](/pl/concepts/memory-search), aby dowiedzieć się, jak działa wyszukiwanie, poznać opcje
dostrajania i konfigurację dostawcy.

## Backendy pamięci

<CardGroup cols={3}>
<Card title="Wbudowany (domyślny)" icon="database" href="/pl/concepts/memory-builtin">
Oparty na SQLite. Działa bez dodatkowej konfiguracji z wyszukiwaniem słów kluczowych, podobieństwem wektorowym i
wyszukiwaniem hybrydowym. Bez dodatkowych zależności.
</Card>
<Card title="QMD" icon="search" href="/pl/concepts/memory-qmd">
Lokalny proces pomocniczy z ponownym szeregowaniem, rozwijaniem zapytań i możliwością indeksowania
katalogów spoza obszaru roboczego.
</Card>
<Card title="Honcho" icon="brain" href="/pl/concepts/memory-honcho">
Natywna dla AI pamięć między sesjami z modelowaniem użytkownika, wyszukiwaniem semantycznym i
obsługą wielu agentów. Instalacja pluginu.
</Card>
<Card title="LanceDB" icon="layers" href="/pl/plugins/memory-lancedb">
Pamięć oparta na LanceDB z osadzeniami zgodnymi z OpenAI, automatycznym przypominaniem,
automatycznym przechwytywaniem i obsługą lokalnych osadzeń Ollama. Instalacja pluginu.
</Card>
</CardGroup>

## Warstwa wiki wiedzy

Aby trwała pamięć zachowywała się bardziej jak utrzymywana baza wiedzy
niż surowe notatki, użyj dołączonego pluginu `memory-wiki`. Kompiluje on trwałą
wiedzę do repozytorium wiki z deterministyczną strukturą stron, ustrukturyzowanymi
twierdzeniami i dowodami, śledzeniem sprzeczności i aktualności, wygenerowanymi
pulpitami, skompilowanymi zestawieniami i narzędziami natywnymi dla wiki (`wiki_status`,
`wiki_search`, `wiki_get`, `wiki_apply`, `wiki_lint`).

`memory-wiki` nie zastępuje aktywnego pluginu pamięci; aktywny plugin pamięci
nadal odpowiada za przywoływanie, promowanie i Dreaming. `memory-wiki` dodaje obok niego
warstwę wiedzy z rozbudowaną informacją o pochodzeniu.

<CardGroup cols={1}>
<Card title="Wiki pamięci" icon="book" href="/pl/plugins/memory-wiki">
Kompiluje trwałą pamięć do repozytorium wiki z rozbudowaną informacją o pochodzeniu, twierdzeniami,
pulpitami, trybem pomostowym i przepływami pracy przyjaznymi dla Obsidian.
</Card>
</CardGroup>

## Automatyczne opróżnianie pamięci

Zanim [Compaction](/pl/concepts/compaction) podsumuje rozmowę,
OpenClaw uruchamia cichą turę przypominającą agentowi o zapisaniu ważnego kontekstu
w plikach pamięci. Funkcja jest domyślnie włączona; ustaw
`agents.defaults.compaction.memoryFlush.enabled: false`, aby ją wyłączyć.

Aby ta tura porządkowa korzystała z modelu lokalnego, ustaw dokładne nadpisanie,
które ma zastosowanie wyłącznie do tury opróżniania pamięci (nie dziedziczy łańcucha
modeli zapasowych aktywnej sesji):

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
Opróżnianie pamięci zapobiega utracie kontekstu podczas Compaction. Jeśli rozmowa
zawiera ważne fakty, które nie zostały jeszcze zapisane w pliku, są one
automatycznie zapisywane przed utworzeniem podsumowania.
</Tip>

## Dreaming

Dreaming to opcjonalny proces konsolidacji pamięci w tle. Gromadzi
krótkoterminowe sygnały przywołania, ocenia kandydatów i promuje do pamięci
długoterminowej (`MEMORY.md`) tylko zakwalifikowane elementy:

- **Opcjonalne**: domyślnie wyłączone.
- **Zaplanowane**: po włączeniu `memory-core` automatycznie zarządza jednym cyklicznym zadaniem Cron
  wykonującym pełny przebieg Dreaming.
- **Progowe**: promocje muszą przejść progi wyniku, częstotliwości przywołania i
  różnorodności zapytań.
- **Możliwe do weryfikacji**: podsumowania faz i wpisy dziennika są zapisywane w
  `DREAMS.md` do weryfikacji przez człowieka.

Zobacz [Dreaming](/pl/concepts/dreaming), aby poznać zachowanie faz, sygnały oceny i
szczegóły Dziennika snów.

## Ugruntowane uzupełnianie danych i promocja na żywo

System Dreaming ma dwie powiązane ścieżki weryfikacji:

- **Dreaming na żywo** korzysta z krótkoterminowego magazynu Dreaming w
  `memory/.dreams/` i służy normalnej fazie głębokiej do decydowania, co
  trafia do `MEMORY.md`.
- **Ugruntowane uzupełnianie danych** odczytuje historyczne notatki `memory/YYYY-MM-DD.md` jako
  samodzielne pliki dzienne i zapisuje ustrukturyzowane wyniki weryfikacji w `DREAMS.md`.

Ugruntowane uzupełnianie danych przydaje się do ponownego przetwarzania starszych notatek i sprawdzania, co
system uznaje za trwałe, bez ręcznego edytowania `MEMORY.md`.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Flaga `--stage-short-term` umieszcza ugruntowanych kandydatów na trwałe wspomnienia w tym samym
krótkoterminowym magazynie Dreaming, którego używa już normalna faza głęboka; nie
promuje ich bezpośrednio. Zatem:

- `DREAMS.md` pozostaje powierzchnią weryfikacji przez człowieka.
- Magazyn krótkoterminowy pozostaje powierzchnią szeregującą przeznaczoną dla maszyny.
- `MEMORY.md` jest nadal zapisywany wyłącznie przez promocję w fazie głębokiej.

Aby cofnąć ponowne przetwarzanie bez zmieniania zwykłych wpisów dziennika ani normalnego stanu
przywoływania:

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
- [Wbudowany silnik pamięci](/pl/concepts/memory-builtin): domyślny backend SQLite.
- [Silnik pamięci QMD](/pl/concepts/memory-qmd): zaawansowany lokalny proces pomocniczy.
- [Pamięć Honcho](/pl/concepts/memory-honcho): pamięć między sesjami zaprojektowana z myślą o AI.
- [Pamięć LanceDB](/pl/plugins/memory-lancedb): Plugin oparty na LanceDB z osadzeniami zgodnymi z OpenAI.
- [Wiki pamięci](/pl/plugins/memory-wiki): skompilowany magazyn wiedzy i narzędzia natywne dla wiki.
- [Dreaming](/pl/concepts/dreaming): działające w tle przenoszenie informacji z pamięci krótkotrwałej do długotrwałej.
- [Dokumentacja konfiguracji pamięci](/pl/reference/memory-config): wszystkie opcje konfiguracji.
- [Compaction](/pl/concepts/compaction): sposób interakcji Compaction z pamięcią.
- [Active Memory](/pl/concepts/active-memory): pamięć podagentów dla interaktywnych sesji czatu.
