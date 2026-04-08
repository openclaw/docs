---
read_when:
    - Chcesz zrozumieć, jak działa pamięć
    - Chcesz wiedzieć, jakie pliki pamięci zapisywać
summary: Jak OpenClaw zapamiętuje rzeczy między sesjami
title: Przegląd pamięci
x-i18n:
    generated_at: "2026-04-08T06:01:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3bb8552341b0b651609edaaae826a22fdc535d240aed4fad4af4b069454004af
    source_path: concepts/memory.md
    workflow: 15
---

# Przegląd pamięci

OpenClaw zapamiętuje rzeczy, zapisując **zwykłe pliki Markdown** w przestrzeni
roboczej Twojego agenta. Model „pamięta” tylko to, co zostanie zapisane na dysku —
nie ma żadnego ukrytego stanu.

## Jak to działa

Twój agent ma trzy pliki związane z pamięcią:

- **`MEMORY.md`** — pamięć długoterminowa. Trwałe fakty, preferencje i
  decyzje. Wczytywany na początku każdej sesji DM.
- **`memory/YYYY-MM-DD.md`** — codzienne notatki. Bieżący kontekst i obserwacje.
  Dzisiejsze i wczorajsze notatki są wczytywane automatycznie.
- **`DREAMS.md`** (eksperymentalny, opcjonalny) — Dream Diary i podsumowania
  przebiegów śnienia do przeglądu przez człowieka.

Te pliki znajdują się w przestrzeni roboczej agenta (domyślnie `~/.openclaw/workspace`).

<Tip>
Jeśli chcesz, aby Twój agent coś zapamiętał, po prostu mu to powiedz: „Pamiętaj,
że wolę TypeScript.” Zapisze to do odpowiedniego pliku.
</Tip>

## Narzędzia pamięci

Agent ma dwa narzędzia do pracy z pamięcią:

- **`memory_search`** — znajduje odpowiednie notatki za pomocą wyszukiwania semantycznego, nawet gdy
  sformułowanie różni się od oryginału.
- **`memory_get`** — odczytuje konkretny plik pamięci lub zakres wierszy.

Oba narzędzia są dostarczane przez aktywny plugin pamięci (domyślnie: `memory-core`).

## Plugin towarzyszący Memory Wiki

Jeśli chcesz, aby trwała pamięć działała bardziej jak utrzymywana baza wiedzy niż
tylko surowe notatki, użyj dołączonego pluginu `memory-wiki`.

`memory-wiki` kompiluje trwałą wiedzę do skarbca wiki z:

- deterministyczną strukturą stron
- uporządkowanymi twierdzeniami i dowodami
- śledzeniem sprzeczności i aktualności
- generowanymi pulpitami
- skompilowanymi skrótami dla agentów/środowiska uruchomieniowego
- narzędziami natywnymi dla wiki, takimi jak `wiki_search`, `wiki_get`, `wiki_apply` i `wiki_lint`

Nie zastępuje aktywnego pluginu pamięci. Aktywny plugin pamięci nadal
odpowiada za przywoływanie, promowanie i śnienie. `memory-wiki` dodaje obok niego
warstwę wiedzy bogatą w informacje o pochodzeniu.

Zobacz [Memory Wiki](/pl/plugins/memory-wiki).

## Wyszukiwanie w pamięci

Gdy skonfigurowany jest dostawca osadzeń, `memory_search` używa **wyszukiwania
hybrydowego** — łącząc podobieństwo wektorowe (znaczenie semantyczne) z dopasowaniem słów kluczowych
(dokładne terminy, takie jak identyfikatory i symbole kodu). Działa to od razu po
dodaniu klucza API dla dowolnego obsługiwanego dostawcy.

<Info>
OpenClaw automatycznie wykrywa dostawcę osadzeń na podstawie dostępnych kluczy API. Jeśli
masz skonfigurowany klucz OpenAI, Gemini, Voyage lub Mistral, wyszukiwanie w pamięci
jest włączane automatycznie.
</Info>

Szczegółowe informacje o działaniu wyszukiwania, opcjach dostrajania i konfiguracji dostawców znajdziesz w
[Memory Search](/pl/concepts/memory-search).

## Backendy pamięci

<CardGroup cols={3}>
<Card title="Wbudowany (domyślny)" icon="database" href="/pl/concepts/memory-builtin">
Oparty na SQLite. Działa od razu z wyszukiwaniem po słowach kluczowych, podobieństwem wektorowym i
wyszukiwaniem hybrydowym. Bez dodatkowych zależności.
</Card>
<Card title="QMD" icon="search" href="/pl/concepts/memory-qmd">
Lokalny sidecar z rerankingiem, rozszerzaniem zapytań i możliwością indeksowania
katalogów poza przestrzenią roboczą.
</Card>
<Card title="Honcho" icon="brain" href="/pl/concepts/memory-honcho">
Natywna dla AI pamięć między sesjami z modelowaniem użytkownika, wyszukiwaniem semantycznym i
świadomością wielu agentów. Instalacja pluginu.
</Card>
</CardGroup>

## Warstwa wiki wiedzy

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/pl/plugins/memory-wiki">
Kompiluje trwałą pamięć do skarbca wiki bogatego w informacje o pochodzeniu, z twierdzeniami,
pulpitami, trybem bridge i przepływami pracy przyjaznymi dla Obsidian.
</Card>
</CardGroup>

## Automatyczne opróżnianie pamięci

Zanim [kompaktowanie](/pl/concepts/compaction) podsumuje Twoją rozmowę, OpenClaw
uruchamia cichą turę, która przypomina agentowi o zapisaniu ważnego kontekstu do plików
pamięci. Jest to domyślnie włączone — nie musisz niczego konfigurować.

<Tip>
Opróżnianie pamięci zapobiega utracie kontekstu podczas kompaktowania. Jeśli Twój agent ma
w rozmowie ważne fakty, które nie zostały jeszcze zapisane do pliku,
zostaną zapisane automatycznie przed utworzeniem podsumowania.
</Tip>

## Śnienie (eksperymentalne)

Śnienie to opcjonalny proces konsolidacji pamięci działający w tle. Zbiera
sygnały krótkoterminowe, ocenia kandydatów i promuje tylko kwalifikujące się elementy do
pamięci długoterminowej (`MEMORY.md`).

Zostało zaprojektowane tak, aby utrzymywać wysoki stosunek sygnału do szumu w pamięci długoterminowej:

- **Opt-in**: domyślnie wyłączone.
- **Zaplanowane**: po włączeniu `memory-core` automatycznie zarządza jednym cyklicznym zadaniem cron
  dla pełnego przebiegu śnienia.
- **Progowe**: promocje muszą przejść progi punktacji, częstotliwości przywołań i
  różnorodności zapytań.
- **Możliwe do przeglądu**: podsumowania faz i wpisy dziennika są zapisywane do `DREAMS.md`
  do przeglądu przez człowieka.

Informacje o zachowaniu faz, sygnałach punktacji i szczegółach Dream Diary znajdziesz w
[Dreaming (experimental)](/pl/concepts/dreaming).

## CLI

```bash
openclaw memory status          # Sprawdź stan indeksu i dostawcę
openclaw memory search "query"  # Wyszukuj z wiersza poleceń
openclaw memory index --force   # Przebuduj indeks
```

## Dalsza lektura

- [Builtin Memory Engine](/pl/concepts/memory-builtin) — domyślny backend SQLite
- [QMD Memory Engine](/pl/concepts/memory-qmd) — zaawansowany lokalny sidecar
- [Honcho Memory](/pl/concepts/memory-honcho) — natywna dla AI pamięć między sesjami
- [Memory Wiki](/pl/plugins/memory-wiki) — skompilowany skarbiec wiedzy i narzędzia natywne dla wiki
- [Memory Search](/pl/concepts/memory-search) — potok wyszukiwania, dostawcy i
  dostrajanie
- [Dreaming (experimental)](/pl/concepts/dreaming) — promowanie w tle
  z krótkoterminowego przywoływania do pamięci długoterminowej
- [Memory configuration reference](/pl/reference/memory-config) — wszystkie opcje konfiguracji
- [Compaction](/pl/concepts/compaction) — jak kompaktowanie współdziała z pamięcią
