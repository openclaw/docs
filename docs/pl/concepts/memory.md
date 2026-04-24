---
read_when:
    - Chcesz zrozumieć, jak działa pamięć.
    - Chcesz wiedzieć, jakie pliki pamięci zapisywać.
summary: Jak OpenClaw zapamiętuje rzeczy między sesjami
title: Przegląd pamięci
x-i18n:
    generated_at: "2026-04-24T09:06:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 761eac6d5c125ae5734dbd654032884846706e50eb8ef7942cdb51b74a1e73d4
    source_path: concepts/memory.md
    workflow: 15
---

OpenClaw zapamiętuje rzeczy, zapisując **zwykłe pliki Markdown** w workspace
twojego agenta. Model „pamięta” tylko to, co zostanie zapisane na dysku — nie ma
żadnego ukrytego stanu.

## Jak to działa

Twój agent ma trzy pliki związane z pamięcią:

- **`MEMORY.md`** — pamięć długoterminowa. Trwałe fakty, preferencje i
  decyzje. Ładowana na początku każdej sesji DM.
- **`memory/YYYY-MM-DD.md`** — notatki dzienne. Bieżący kontekst i obserwacje.
  Dzisiejsze i wczorajsze notatki są ładowane automatycznie.
- **`DREAMS.md`** (opcjonalnie) — Dream Diary i podsumowania przebiegów
  Dreaming do przeglądu przez człowieka, w tym ugruntowane wpisy historycznego backfillu.

Te pliki znajdują się w workspace agenta (domyślnie `~/.openclaw/workspace`).

<Tip>
Jeśli chcesz, aby agent coś zapamiętał, po prostu go o to poproś: „Zapamiętaj,
że preferuję TypeScript.” Zapisze to do odpowiedniego pliku.
</Tip>

## Narzędzia pamięci

Agent ma dwa narzędzia do pracy z pamięcią:

- **`memory_search`** — znajduje istotne notatki za pomocą wyszukiwania semantycznego, nawet gdy
  sformułowanie różni się od oryginału.
- **`memory_get`** — odczytuje określony plik pamięci albo zakres wierszy.

Oba narzędzia są dostarczane przez aktywny Plugin pamięci (domyślnie: `memory-core`).

## Towarzyszący Plugin Memory Wiki

Jeśli chcesz, aby trwała pamięć bardziej przypominała utrzymywaną bazę wiedzy niż
surowe notatki, użyj dołączonego Pluginu `memory-wiki`.

`memory-wiki` kompiluje trwałą wiedzę do skarbca wiki z:

- deterministyczną strukturą stron
- ustrukturyzowanymi twierdzeniami i dowodami
- śledzeniem sprzeczności i aktualności
- generowanymi dashboardami
- skompilowanymi digestami dla agentów/odbiorców runtime
- narzędziami natywnymi dla wiki, takimi jak `wiki_search`, `wiki_get`, `wiki_apply` i `wiki_lint`

Nie zastępuje aktywnego Pluginu pamięci. Aktywny Plugin pamięci nadal
zarządza przypominaniem, promowaniem i Dreaming. `memory-wiki` dodaje obok niego
warstwę wiedzy bogatą w pochodzenie.

Zobacz [Memory Wiki](/pl/plugins/memory-wiki).

## Wyszukiwanie pamięci

Gdy skonfigurowano dostawcę embeddingów, `memory_search` używa **wyszukiwania
hybrydowego** — łączy podobieństwo wektorowe (znaczenie semantyczne) z dopasowaniem słów kluczowych
(dokładne terminy, takie jak identyfikatory i symbole kodu). Działa od razu po
dodaniu klucza API dowolnego obsługiwanego dostawcy.

<Info>
OpenClaw automatycznie wykrywa dostawcę embeddingów na podstawie dostępnych kluczy API. Jeśli
masz skonfigurowany klucz OpenAI, Gemini, Voyage albo Mistral, wyszukiwanie pamięci jest
włączane automatycznie.
</Info>

Szczegółowe informacje o tym, jak działa wyszukiwanie, opcjach strojenia i konfiguracji dostawców znajdziesz w
[Wyszukiwaniu pamięci](/pl/concepts/memory-search).

## Backendy pamięci

<CardGroup cols={3}>
<Card title="Wbudowany (domyślny)" icon="database" href="/pl/concepts/memory-builtin">
Oparty na SQLite. Działa od razu z wyszukiwaniem po słowach kluczowych, podobieństwem wektorowym i
wyszukiwaniem hybrydowym. Bez dodatkowych zależności.
</Card>
<Card title="QMD" icon="search" href="/pl/concepts/memory-qmd">
Lokalny sidecar z rerankingiem, rozwijaniem zapytań i możliwością indeksowania
katalogów poza workspace.
</Card>
<Card title="Honcho" icon="brain" href="/pl/concepts/memory-honcho">
Natywna dla AI pamięć między sesjami z modelowaniem użytkownika, wyszukiwaniem semantycznym i
świadomością wielu agentów. Instalacja jako Plugin.
</Card>
</CardGroup>

## Warstwa wiki wiedzy

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/pl/plugins/memory-wiki">
Kompiluje trwałą pamięć do skarbca wiki bogatego w pochodzenie z twierdzeniami,
dashboardami, trybem bridge i przepływami pracy przyjaznymi dla Obsidian.
</Card>
</CardGroup>

## Automatyczny flush pamięci

Zanim [Compaction](/pl/concepts/compaction) podsumuje twoją rozmowę, OpenClaw
uruchamia cichą turę, która przypomina agentowi o zapisaniu ważnego kontekstu do plików pamięci.
Jest to włączone domyślnie — nie musisz niczego konfigurować.

<Tip>
Flush pamięci zapobiega utracie kontekstu podczas Compaction. Jeśli agent ma
w rozmowie ważne fakty, które nie zostały jeszcze zapisane do pliku,
zostaną zapisane automatycznie, zanim nastąpi podsumowanie.
</Tip>

## Dreaming

Dreaming to opcjonalny przebieg konsolidacji pamięci w tle. Zbiera
krótkoterminowe sygnały, ocenia kandydatów i promuje tylko kwalifikujące się elementy do
pamięci długoterminowej (`MEMORY.md`).

Zaprojektowano go tak, aby utrzymywać wysoką jakość pamięci długoterminowej:

- **Opt-in**: domyślnie wyłączone.
- **Zaplanowane**: po włączeniu `memory-core` automatycznie zarządza jednym cyklicznym zadaniem Cron
  dla pełnego przebiegu Dreaming.
- **Z progami**: promocje muszą przejść progi oceny, częstotliwości przypominania i
  różnorodności zapytań.
- **Możliwe do przeglądu**: podsumowania faz i wpisy dziennika są zapisywane do `DREAMS.md`
  do przeglądu przez człowieka.

Zachowanie faz, sygnały oceny i szczegóły Dream Diary opisano w
[Dreaming](/pl/concepts/dreaming).

## Ugruntowany backfill i promocja na żywo

System Dreaming ma teraz dwa ściśle powiązane tory przeglądu:

- **Live dreaming** działa na krótkoterminowym magazynie Dreaming w
  `memory/.dreams/` i jest tym, czego używa normalna głęboka faza przy decydowaniu, co
  może trafić do `MEMORY.md`.
- **Grounded backfill** odczytuje historyczne notatki `memory/YYYY-MM-DD.md` jako
  samodzielne pliki dni i zapisuje ustrukturyzowane wyniki przeglądu do `DREAMS.md`.

Grounded backfill jest przydatny, gdy chcesz odtworzyć starsze notatki i sprawdzić, co
system uważa za trwałe, bez ręcznej edycji `MEMORY.md`.

Gdy użyjesz:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

ugruntowani trwa­li kandydaci nie są promowani bezpośrednio. Zamiast tego są umieszczani
w tym samym krótkoterminowym magazynie Dreaming, którego używa już normalna głęboka faza. To oznacza, że:

- `DREAMS.md` pozostaje powierzchnią przeglądu dla człowieka.
- krótkoterminowy magazyn pozostaje powierzchnią rankingową dla maszyn.
- `MEMORY.md` nadal jest zapisywane tylko przez głęboką promocję.

Jeśli uznasz, że odtworzenie nie było przydatne, możesz usunąć przygotowane artefakty
bez naruszania zwykłych wpisów dziennika ani normalnego stanu przypominania:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Sprawdź stan indeksu i dostawcę
openclaw memory search "query"  # Szukaj z wiersza poleceń
openclaw memory index --force   # Przebuduj indeks
```

## Dalsza lektura

- [Wbudowany silnik pamięci](/pl/concepts/memory-builtin) — domyślny backend SQLite
- [Silnik pamięci QMD](/pl/concepts/memory-qmd) — zaawansowany lokalny sidecar
- [Pamięć Honcho](/pl/concepts/memory-honcho) — natywna dla AI pamięć między sesjami
- [Memory Wiki](/pl/plugins/memory-wiki) — skompilowany skarbiec wiedzy i narzędzia natywne dla wiki
- [Wyszukiwanie pamięci](/pl/concepts/memory-search) — pipeline wyszukiwania, dostawcy i
  strojenie
- [Dreaming](/pl/concepts/dreaming) — promocja w tle
  z krótkoterminowego przypominania do pamięci długoterminowej
- [Dokumentacja konfiguracji pamięci](/pl/reference/memory-config) — wszystkie opcje konfiguracji
- [Compaction](/pl/concepts/compaction) — jak Compaction współdziała z pamięcią

## Powiązane

- [Active Memory](/pl/concepts/active-memory)
- [Wyszukiwanie pamięci](/pl/concepts/memory-search)
- [Wbudowany silnik pamięci](/pl/concepts/memory-builtin)
- [Pamięć Honcho](/pl/concepts/memory-honcho)
