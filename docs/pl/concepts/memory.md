---
read_when:
    - Chcesz zrozumieć, jak działa pamięć
    - Chcesz wiedzieć, które pliki pamięci zapisać
summary: Jak OpenClaw zapamiętuje informacje między sesjami
title: Przegląd pamięci
x-i18n:
    generated_at: "2026-04-30T09:47:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: ecf6cf2c95ce3ee78d62923e795f16957088f0eb6620ed50647cff05b99bd572
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw zapamiętuje rzeczy, zapisując **zwykłe pliki Markdown** w przestrzeni
roboczej agenta. Model „pamięta” tylko to, co zostanie zapisane na dysku — nie
ma żadnego ukrytego stanu.

## Jak to działa

Twój agent ma trzy pliki związane z pamięcią:

- **`MEMORY.md`** — pamięć długoterminowa. Trwałe fakty, preferencje i
  decyzje. Ładowana na początku każdej sesji DM.
- **`memory/YYYY-MM-DD.md`** — notatki dzienne. Bieżący kontekst i obserwacje.
  Notatki z dzisiaj i wczoraj są ładowane automatycznie.
- **`DREAMS.md`** (opcjonalnie) — Dziennik Dreaming i podsumowania przeglądów
  Dreaming do weryfikacji przez człowieka, w tym osadzone w źródłach historyczne wpisy backfill.

Te pliki znajdują się w przestrzeni roboczej agenta (domyślnie `~/.openclaw/workspace`).

<Tip>
Jeśli chcesz, aby agent coś zapamiętał, po prostu go o to poproś: „Zapamiętaj,
że preferuję TypeScript”. Zapisze to w odpowiednim pliku.
</Tip>

## Wywnioskowane zobowiązania

Niektóre przyszłe działania następcze nie są trwałymi faktami. Jeśli wspomnisz o rozmowie
kwalifikacyjnej jutro, użyteczną pamięcią może być „sprawdź po rozmowie”, a nie „zapisz
to na zawsze w `MEMORY.md`”.

[Zobowiązania](/pl/concepts/commitments) to opcjonalne, krótkotrwałe pamięci działań następczych
dla takiego przypadku. OpenClaw wywnioskuje je w ukrytym przebiegu w tle, ogranicza je do
tego samego agenta i kanału oraz dostarcza należne sprawdzenia przez Heartbeat.
Jawne przypomnienia nadal używają [zaplanowanych zadań](/pl/automation/cron-jobs).

## Narzędzia pamięci

Agent ma dwa narzędzia do pracy z pamięcią:

- **`memory_search`** — znajduje odpowiednie notatki przy użyciu wyszukiwania semantycznego, nawet gdy
  sformułowanie różni się od oryginału.
- **`memory_get`** — odczytuje konkretny plik pamięci lub zakres wierszy.

Oba narzędzia są udostępniane przez aktywny Plugin pamięci (domyślnie: `memory-core`).

## Plugin towarzyszący Memory Wiki

Jeśli chcesz, aby trwała pamięć działała bardziej jak utrzymywana baza wiedzy niż
surowe notatki, użyj dołączonego Pluginu `memory-wiki`.

`memory-wiki` kompiluje trwałą wiedzę do skarbca wiki z:

- deterministyczną strukturą stron
- ustrukturyzowanymi twierdzeniami i dowodami
- śledzeniem sprzeczności i świeżości
- wygenerowanymi pulpitami
- skompilowanymi skrótami dla konsumentów agenta/środowiska uruchomieniowego
- natywnymi narzędziami wiki, takimi jak `wiki_search`, `wiki_get`, `wiki_apply` i `wiki_lint`

Nie zastępuje aktywnego Pluginu pamięci. Aktywny Plugin pamięci nadal
odpowiada za przywoływanie, promowanie i Dreaming. `memory-wiki` dodaje obok niego
warstwę wiedzy bogatą w informacje o pochodzeniu.

Zobacz [Memory Wiki](/pl/plugins/memory-wiki).

## Wyszukiwanie w pamięci

Gdy skonfigurowany jest dostawca osadzeń, `memory_search` używa **wyszukiwania
hybrydowego** — łączącego podobieństwo wektorowe (znaczenie semantyczne) z dopasowaniem słów kluczowych
(dokładne terminy, takie jak identyfikatory i symbole kodu). Działa to od razu, gdy masz
klucz API dowolnego obsługiwanego dostawcy.

<Info>
OpenClaw automatycznie wykrywa dostawcę osadzeń na podstawie dostępnych kluczy API. Jeśli masz
skonfigurowany klucz OpenAI, Gemini, Voyage lub Mistral, wyszukiwanie w pamięci jest
włączane automatycznie.
</Info>

Szczegóły działania wyszukiwania, opcje dostrajania i konfigurację dostawcy znajdziesz w
[Wyszukiwaniu w pamięci](/pl/concepts/memory-search).

## Backendy pamięci

<CardGroup cols={3}>
<Card title="Wbudowany (domyślny)" icon="database" href="/pl/concepts/memory-builtin">
Oparty na SQLite. Działa od razu z wyszukiwaniem słów kluczowych, podobieństwem wektorowym i
wyszukiwaniem hybrydowym. Bez dodatkowych zależności.
</Card>
<Card title="QMD" icon="search" href="/pl/concepts/memory-qmd">
Sidecar local-first z ponownym rankingowaniem, rozszerzaniem zapytań i możliwością indeksowania
katalogów poza przestrzenią roboczą.
</Card>
<Card title="Honcho" icon="brain" href="/pl/concepts/memory-honcho">
Natywna dla AI pamięć między sesjami z modelowaniem użytkownika, wyszukiwaniem semantycznym i
świadomością wielu agentów. Instalacja Pluginu.
</Card>
<Card title="LanceDB" icon="layers" href="/pl/plugins/memory-lancedb">
Dołączona pamięć oparta na LanceDB z osadzeniami zgodnymi z OpenAI, automatycznym przywoływaniem,
automatycznym przechwytywaniem i obsługą lokalnych osadzeń Ollama.
</Card>
</CardGroup>

## Warstwa wiki wiedzy

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/pl/plugins/memory-wiki">
Kompiluje trwałą pamięć do skarbca wiki bogatego w informacje o pochodzeniu, z twierdzeniami,
pulpitami, trybem mostu i przepływami pracy przyjaznymi dla Obsidian.
</Card>
</CardGroup>

## Automatyczne opróżnianie pamięci

Zanim [Compaction](/pl/concepts/compaction) podsumuje rozmowę, OpenClaw
uruchamia cichą turę, która przypomina agentowi o zapisaniu ważnego kontekstu do plików
pamięci. Jest to domyślnie włączone — nie musisz niczego konfigurować.

Aby utrzymać tę turę porządkową na modelu lokalnym, ustaw dokładne nadpisanie modelu
opróżniania pamięci:

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

Nadpisanie dotyczy tylko tury opróżniania pamięci i nie dziedziczy
łańcucha rezerwowego aktywnej sesji.

<Tip>
Opróżnianie pamięci zapobiega utracie kontekstu podczas Compaction. Jeśli agent ma
w rozmowie ważne fakty, które nie zostały jeszcze zapisane do pliku, zostaną
automatycznie zapisane przed utworzeniem podsumowania.
</Tip>

## Dreaming

Dreaming to opcjonalny przebieg konsolidacji pamięci w tle. Zbiera
krótkoterminowe sygnały, ocenia kandydatów i promuje tylko kwalifikujące się elementy do
pamięci długoterminowej (`MEMORY.md`).

Zaprojektowano go tak, aby pamięć długoterminowa miała wysoki stosunek sygnału do szumu:

- **Opcjonalne włączenie**: domyślnie wyłączone.
- **Zaplanowane**: po włączeniu `memory-core` automatycznie zarządza jednym cyklicznym zadaniem Cron
  dla pełnego przeglądu Dreaming.
- **Progowe**: promocje muszą przejść bramki wyniku, częstotliwości przywołania i
  różnorodności zapytań.
- **Możliwe do przeglądu**: podsumowania faz i wpisy dziennika są zapisywane w `DREAMS.md`
  do weryfikacji przez człowieka.

Szczegóły zachowania faz, sygnałów punktacji i Dziennika Dreaming znajdziesz w
[Dreaming](/pl/concepts/dreaming).

## Osadzony backfill i promocja na żywo

System Dreaming ma teraz dwie ściśle powiązane ścieżki przeglądu:

- **Dreaming na żywo** działa na krótkoterminowym magazynie Dreaming pod
  `memory/.dreams/` i jest tym, czego normalna faza głęboka używa przy decydowaniu, co
  może przejść do `MEMORY.md`.
- **Osadzony backfill** odczytuje historyczne notatki `memory/YYYY-MM-DD.md` jako
  samodzielne pliki dzienne i zapisuje ustrukturyzowany wynik przeglądu w `DREAMS.md`.

Osadzony backfill jest przydatny, gdy chcesz odtworzyć starsze notatki i sprawdzić, co
system uważa za trwałe, bez ręcznej edycji `MEMORY.md`.

Gdy używasz:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

osadzeni trwali kandydaci nie są promowani bezpośrednio. Są etapowani do
tego samego krótkoterminowego magazynu Dreaming, którego normalna faza głęboka już używa. To
oznacza, że:

- `DREAMS.md` pozostaje powierzchnią przeglądu dla człowieka.
- magazyn krótkoterminowy pozostaje powierzchnią rankingową dla maszyny.
- `MEMORY.md` nadal jest zapisywany tylko przez głęboką promocję.

Jeśli uznasz, że odtworzenie nie było użyteczne, możesz usunąć etapowane artefakty
bez dotykania zwykłych wpisów dziennika ani normalnego stanu przywoływania:

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
- [Memory LanceDB](/pl/plugins/memory-lancedb): Plugin oparty na LanceDB z osadzeniami zgodnymi z OpenAI.
- [Memory Wiki](/pl/plugins/memory-wiki): skompilowany skarbiec wiedzy i natywne narzędzia wiki.
- [Wyszukiwanie w pamięci](/pl/concepts/memory-search): potok wyszukiwania, dostawcy i dostrajanie.
- [Dreaming](/pl/concepts/dreaming): promocja w tle z krótkoterminowego przywoływania do pamięci długoterminowej.
- [Dokumentacja konfiguracji pamięci](/pl/reference/memory-config): wszystkie pokrętła konfiguracji.
- [Compaction](/pl/concepts/compaction): jak Compaction współdziała z pamięcią.

## Powiązane

- [Active memory](/pl/concepts/active-memory)
- [Wyszukiwanie w pamięci](/pl/concepts/memory-search)
- [Wbudowany silnik pamięci](/pl/concepts/memory-builtin)
- [Pamięć Honcho](/pl/concepts/memory-honcho)
- [Memory LanceDB](/pl/plugins/memory-lancedb)
- [Zobowiązania](/pl/concepts/commitments)
