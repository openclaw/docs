---
read_when:
    - Chcesz zrozumieć, jak działa pamięć
    - Chcesz wiedzieć, jakie pliki pamięci zapisać
summary: Jak OpenClaw zapamiętuje informacje między sesjami
title: Przegląd pamięci
x-i18n:
    generated_at: "2026-06-27T17:27:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ddcecfa3d902181583ab076f94a69ca323686c3544399dea2572863726dad2c
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw zapamiętuje rzeczy, zapisując **zwykłe pliki Markdown** w przestrzeni
roboczej Twojego agenta. Model „pamięta” tylko to, co zostanie zapisane na dysku — nie ma
ukrytego stanu.

## Jak to działa

Twój agent ma trzy pliki związane z pamięcią:

- **`MEMORY.md`** — pamięć długoterminowa. Trwałe fakty, preferencje i
  decyzje. Ładowana na początku każdej sesji DM.
- **`memory/YYYY-MM-DD.md`** (lub **`memory/YYYY-MM-DD-<slug>.md`**) — notatki dzienne.
  Bieżący kontekst i obserwacje. Notatki z dzisiaj i wczoraj są ładowane
  automatycznie, a warianty ze slugiem, takie jak te zapisane przez dołączony
  hook pamięci sesji przy `/new` lub `/reset`, są teraz pobierane razem z plikiem
  zawierającym samą datę.
- **`DREAMS.md`** (opcjonalnie) — dziennik Dreaming i podsumowania przebiegów
  Dreaming do przeglądu przez człowieka, w tym ugruntowane historyczne wpisy uzupełniające.

Te pliki znajdują się w przestrzeni roboczej agenta (domyślnie `~/.openclaw/workspace`).

## Co gdzie trafia

`MEMORY.md` to kompaktowa, opracowana warstwa. Używaj go do trwałych faktów,
preferencji, stałych decyzji i krótkich podsumowań, które powinny być dostępne na
początku głównej sesji prywatnej. Nie jest przeznaczony jako surowy transkrypt,
dziennik dzienny ani pełne archiwum.

Pliki `memory/YYYY-MM-DD.md` są warstwą roboczą. Używaj ich do szczegółowych
notatek dziennych, obserwacji, podsumowań sesji i surowego kontekstu, który może
przydać się później. Te pliki są indeksowane dla `memory_search` i `memory_get`, ale nie są
wstrzykiwane do zwykłego promptu startowego przy każdej turze.

Z czasem agent powinien destylować przydatny materiał z notatek dziennych
do `MEMORY.md` i usuwać nieaktualne wpisy długoterminowe. Wygenerowane instrukcje
przestrzeni roboczej i przepływ Heartbeat mogą robić to okresowo; nie musisz
ręcznie edytować `MEMORY.md` dla każdego zapamiętanego szczegółu.

Jeśli `MEMORY.md` przekroczy budżet pliku startowego, OpenClaw zachowuje plik na
dysku w całości, ale obcina kopię wstrzykiwaną do kontekstu modelu. Traktuj to jako
sygnał, aby przenieść szczegółowy materiał z powrotem do `memory/*.md`, zostawić tylko
trwałe podsumowanie w `MEMORY.md` albo podnieść limity startowe, jeśli wyraźnie
chcesz przeznaczyć większy budżet promptu. Użyj `/context list`, `/context detail` lub
`openclaw doctor`, aby zobaczyć rozmiary surowe i wstrzyknięte oraz status obcięcia.

<Tip>
Jeśli chcesz, aby agent coś zapamiętał, po prostu go poproś: „Zapamiętaj, że
wolę TypeScript”. Zapisze to do odpowiedniego pliku.
</Tip>

## Pamięci wrażliwe na działanie

Większość wspomnień można zapisywać jako zwykłe notatki Markdown. Niektóre wspomnienia wpływają jednak na to, co agent powinien zrobić później. W takich przypadkach uchwyć, kiedy można bezpiecznie zadziałać na podstawie notatki, a nie tylko sam fakt.

Uchwyć tę granicę działania, gdy notatka obejmuje:

- wymagania dotyczące zatwierdzenia lub uprawnień,
- tymczasowe ograniczenia,
- przekazania do innej sesji, wątku lub osoby,
- warunki wygaśnięcia,
- moment, od którego działanie jest bezpieczne,
- autorytet źródła lub właściciela,
- instrukcje, aby uniknąć kuszącego działania.

Przydatna pamięć wrażliwa na działanie jasno określa:

- co zmienia przyszłe zachowanie,
- kiedy lub pod jakim warunkiem ma zastosowanie,
- kiedy wygasa albo co odblokowuje działanie,
- czego agent powinien unikać,
- kto jest źródłem lub właścicielem, jeśli wpływa to na zaufanie lub autorytet.

Pamięć może zachować kontekst zatwierdzeń, ale nie egzekwuje polityki. Do twardych kontroli operacyjnych używaj ustawień zatwierdzania OpenClaw, piaskownicy i zadań zaplanowanych.

Przykład:

```md
The API migration is being designed in another session. Future turns should not edit the API implementation from this thread; use findings here only as design input until the migration plan lands.
```

Inny przykład:

```md
A report from an untrusted source needs review before promotion. Future turns should treat it as evidence only; do not store it as durable memory until a trusted reviewer confirms the contents.
```

Używaj [zobowiązań](/pl/concepts/commitments) do wywnioskowanych, krótkotrwałych działań następczych. Używaj [zadań zaplanowanych](/pl/automation/cron-jobs) do dokładnych przypomnień, kontroli czasowych i pracy cyklicznej. Pamięć nadal może podsumowywać trwały kontekst wokół obu ścieżek.

Nie jest to wymagany schemat dla każdej pamięci. Proste fakty mogą pozostać zwięzłe. Używaj granic wrażliwych na działanie wtedy, gdy utrata kontekstu czasu, autorytetu, wygaśnięcia lub bezpieczeństwa działania mogłaby później spowodować błędne działanie agenta.

## Wywnioskowane zobowiązania

Niektóre przyszłe działania następcze nie są trwałymi faktami. Jeśli wspomnisz o rozmowie
jutro, przydatną pamięcią może być „sprawdź po rozmowie”, a nie „zapisz
to na zawsze w `MEMORY.md`”.

[Zobowiązania](/pl/concepts/commitments) to opcjonalne, krótkotrwałe pamięci działań następczych
dla takiego przypadku. OpenClaw wywnioskowuje je w ukrytym przebiegu w tle, ogranicza je do
tego samego agenta i kanału oraz dostarcza należne sprawdzenia przez Heartbeat.
Jawne przypomnienia nadal używają [zadań zaplanowanych](/pl/automation/cron-jobs).

## Narzędzia pamięci

Agent ma dwa narzędzia do pracy z pamięcią:

- **`memory_search`** — znajduje istotne notatki za pomocą wyszukiwania semantycznego, nawet gdy
  sformułowanie różni się od oryginału.
- **`memory_get`** — odczytuje konkretny plik pamięci lub zakres wierszy.

Oba narzędzia są dostarczane przez aktywny plugin pamięci (domyślnie: `memory-core`).

## Plugin towarzyszący Memory Wiki

Jeśli chcesz, aby trwała pamięć zachowywała się bardziej jak utrzymywana baza wiedzy niż
tylko surowe notatki, użyj dołączonego pluginu `memory-wiki`.

`memory-wiki` kompiluje trwałą wiedzę do skarbca wiki z:

- deterministyczną strukturą stron
- ustrukturyzowanymi twierdzeniami i dowodami
- śledzeniem sprzeczności i świeżości
- generowanymi panelami
- skompilowanymi streszczeniami dla odbiorców agenta/środowiska wykonawczego
- natywnymi narzędziami wiki, takimi jak `wiki_search`, `wiki_get`, `wiki_apply` i `wiki_lint`

Nie zastępuje aktywnego pluginu pamięci. Aktywny plugin pamięci nadal
odpowiada za przypominanie, promowanie i Dreaming. `memory-wiki` dodaje obok niego
warstwę wiedzy bogatą w pochodzenie informacji.

Zobacz [Memory Wiki](/pl/plugins/memory-wiki).

## Wyszukiwanie w pamięci

Gdy skonfigurowany jest dostawca embeddingów, `memory_search` używa **wyszukiwania
hybrydowego** — łącząc podobieństwo wektorowe (znaczenie semantyczne) z dopasowaniem słów kluczowych
(dokładne terminy, takie jak identyfikatory i symbole kodu). Działa to od razu, gdy masz
klucz API dla dowolnego obsługiwanego dostawcy.

<Info>
OpenClaw domyślnie używa embeddingów OpenAI. Ustaw
`agents.defaults.memorySearch.provider` jawnie, aby używać embeddingów Gemini, Voyage,
Mistral, local, Ollama, Bedrock, GitHub Copilot lub zgodnych z OpenAI.
</Info>

Szczegóły działania wyszukiwania, opcje dostrajania i konfigurację dostawcy znajdziesz w
[Wyszukiwanie w pamięci](/pl/concepts/memory-search).

## Backendy pamięci

<CardGroup cols={3}>
<Card title="Builtin (default)" icon="database" href="/pl/concepts/memory-builtin">
Oparte na SQLite. Działa od razu z wyszukiwaniem słów kluczowych, podobieństwem wektorowym i
wyszukiwaniem hybrydowym. Bez dodatkowych zależności.
</Card>
<Card title="QMD" icon="search" href="/pl/concepts/memory-qmd">
Sidecar local-first z rerankingiem, rozszerzaniem zapytań i możliwością indeksowania
katalogów poza przestrzenią roboczą.
</Card>
<Card title="Honcho" icon="brain" href="/pl/concepts/memory-honcho">
Natywna dla AI pamięć między sesjami z modelowaniem użytkownika, wyszukiwaniem semantycznym i
świadomością wielu agentów. Instalacja pluginu.
</Card>
<Card title="LanceDB" icon="layers" href="/pl/plugins/memory-lancedb">
Dołączona pamięć oparta na LanceDB z embeddingami zgodnymi z OpenAI, automatycznym przypominaniem,
automatycznym przechwytywaniem i obsługą lokalnych embeddingów Ollama.
</Card>
</CardGroup>

## Warstwa wiki wiedzy

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/pl/plugins/memory-wiki">
Kompiluje trwałą pamięć do skarbca wiki bogatego w pochodzenie informacji, z twierdzeniami,
panelami, trybem pomostowym i przepływami pracy przyjaznymi dla Obsidian.
</Card>
</CardGroup>

## Automatyczne zrzucanie pamięci

Zanim [Compaction](/pl/concepts/compaction) podsumuje Twoją rozmowę, OpenClaw
uruchamia cichą turę, która przypomina agentowi o zapisaniu ważnego kontekstu do plików
pamięci. Jest to domyślnie włączone — nie musisz niczego konfigurować.

Aby zachować tę turę porządkową na modelu lokalnym, ustaw dokładne nadpisanie modelu
zrzutu pamięci:

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

Nadpisanie dotyczy tylko tury zrzutu pamięci i nie dziedziczy
łańcucha fallbacków aktywnej sesji.

<Tip>
Zrzut pamięci zapobiega utracie kontekstu podczas Compaction. Jeśli agent ma
ważne fakty w rozmowie, które nie zostały jeszcze zapisane do pliku, zostaną
automatycznie zapisane przed utworzeniem podsumowania.
</Tip>

## Dreaming

Dreaming to opcjonalny przebieg konsolidacji pamięci w tle. Zbiera
sygnały krótkoterminowe, ocenia kandydatów i promuje tylko kwalifikujące się elementy do
pamięci długoterminowej (`MEMORY.md`).

Został zaprojektowany tak, aby pamięć długoterminowa miała wysoką wartość sygnału:

- **Opcjonalny**: domyślnie wyłączony.
- **Zaplanowany**: po włączeniu `memory-core` automatycznie zarządza jednym cyklicznym zadaniem cron
  dla pełnego przebiegu Dreaming.
- **Progowy**: promocje muszą przejść bramki wyniku, częstotliwości przypominania i różnorodności
  zapytań.
- **Możliwy do przeglądu**: podsumowania faz i wpisy dziennika są zapisywane do `DREAMS.md`
  do przeglądu przez człowieka.

Zachowanie faz, sygnały punktacji i szczegóły dziennika Dreaming opisuje
[Dreaming](/pl/concepts/dreaming).

## Ugruntowane uzupełnianie i promocja na żywo

System Dreaming ma teraz dwie blisko powiązane ścieżki przeglądu:

- **Dreaming na żywo** działa na krótkoterminowym magazynie Dreaming pod
  `memory/.dreams/` i jest tym, czego zwykła faza głęboka używa przy podejmowaniu decyzji, co
  może przejść do `MEMORY.md`.
- **Ugruntowane uzupełnianie** odczytuje historyczne notatki `memory/YYYY-MM-DD.md` jako
  samodzielne pliki dzienne i zapisuje ustrukturyzowany wynik przeglądu do `DREAMS.md`.

Ugruntowane uzupełnianie jest przydatne, gdy chcesz odtworzyć starsze notatki i sprawdzić, co
system uznaje za trwałe, bez ręcznego edytowania `MEMORY.md`.

Gdy użyjesz:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

ugruntowani kandydaci do pamięci trwałej nie są promowani bezpośrednio. Są umieszczani etapowo w
tym samym krótkoterminowym magazynie Dreaming, którego zwykła faza głęboka już używa. To
oznacza, że:

- `DREAMS.md` pozostaje powierzchnią przeglądu dla człowieka.
- magazyn krótkoterminowy pozostaje powierzchnią rankingu dla maszyny.
- `MEMORY.md` nadal jest zapisywany tylko przez głęboką promocję.

Jeśli uznasz, że odtworzenie nie było przydatne, możesz usunąć przygotowane artefakty
bez dotykania zwykłych wpisów dziennika ani normalnego stanu przypominania:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Check index status and provider
openclaw memory search "query"  # Search from the command line
openclaw memory index --force   # Rebuild the index
```

## Dalsza lektura

- [Wbudowany silnik pamięci](/pl/concepts/memory-builtin): domyślny backend SQLite.
- [Silnik pamięci QMD](/pl/concepts/memory-qmd): zaawansowany sidecar local-first.
- [Pamięć Honcho](/pl/concepts/memory-honcho): natywna dla AI pamięć między sesjami.
- [Memory LanceDB](/pl/plugins/memory-lancedb): plugin oparty na LanceDB z embeddingami zgodnymi z OpenAI.
- [Memory Wiki](/pl/plugins/memory-wiki): skompilowany skarbiec wiedzy i natywne narzędzia wiki.
- [Wyszukiwanie w pamięci](/pl/concepts/memory-search): potok wyszukiwania, dostawcy i dostrajanie.
- [Dreaming](/pl/concepts/dreaming): promocja w tle z krótkoterminowego przypominania do pamięci długoterminowej.
- [Odwołanie konfiguracji pamięci](/pl/reference/memory-config): wszystkie pokrętła konfiguracji.
- [Compaction](/pl/concepts/compaction): jak Compaction współdziała z pamięcią.

## Powiązane

- [Active Memory](/pl/concepts/active-memory)
- [Wyszukiwanie w pamięci](/pl/concepts/memory-search)
- [Wbudowany silnik pamięci](/pl/concepts/memory-builtin)
- [Pamięć Honcho](/pl/concepts/memory-honcho)
- [Memory LanceDB](/pl/plugins/memory-lancedb)
- [Zobowiązania](/pl/concepts/commitments)
