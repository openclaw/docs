---
read_when:
    - Chcesz zrozumieć, jak działa pamięć
    - Chcesz wiedzieć, jakie pliki pamięci zapisywać
summary: Jak OpenClaw zapamiętuje rzeczy między sesjami
title: Przegląd pamięci
x-i18n:
    generated_at: "2026-04-05T13:50:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89fbd20cf2bcdf461a9e311ee0ff43b5f69d9953519656eecd419b4a419256f8
    source_path: concepts/memory.md
    workflow: 15
---

# Przegląd pamięci

OpenClaw zapamiętuje rzeczy, zapisując **zwykłe pliki Markdown** w workspace
agenta. Model „pamięta” tylko to, co zostanie zapisane na dysku — nie ma
żadnego ukrytego stanu.

## Jak to działa

Agent ma dwa miejsca do przechowywania pamięci:

- **`MEMORY.md`** — pamięć długoterminowa. Trwałe fakty, preferencje i
  decyzje. Wczytywana na początku każdej sesji DM.
- **`memory/YYYY-MM-DD.md`** — notatki dzienne. Bieżący kontekst i obserwacje.
  Dzisiejsze i wczorajsze notatki są wczytywane automatycznie.

Te pliki znajdują się w workspace agenta (domyślnie `~/.openclaw/workspace`).

<Tip>
Jeśli chcesz, aby agent coś zapamiętał, po prostu go o to poproś: „Zapamiętaj, że
preferuję TypeScript”. Zapisze to do odpowiedniego pliku.
</Tip>

## Narzędzia pamięci

Agent ma dwa narzędzia do pracy z pamięcią:

- **`memory_search`** — znajduje istotne notatki za pomocą wyszukiwania semantycznego, nawet gdy
  sformułowanie różni się od oryginału.
- **`memory_get`** — odczytuje konkretny plik pamięci lub zakres wierszy.

Oba narzędzia są dostarczane przez aktywny plugin pamięci (domyślnie: `memory-core`).

## Wyszukiwanie pamięci

Gdy skonfigurowano dostawcę embeddingów, `memory_search` używa **wyszukiwania
hybrydowego** — łącząc podobieństwo wektorowe (znaczenie semantyczne) z dopasowaniem słów kluczowych
(dokładne terminy, takie jak identyfikatory i symbole kodu). Działa to od razu,
gdy masz klucz API dla dowolnego obsługiwanego dostawcy.

<Info>
OpenClaw automatycznie wykrywa dostawcę embeddingów na podstawie dostępnych kluczy API. Jeśli
masz skonfigurowany klucz OpenAI, Gemini, Voyage lub Mistral, wyszukiwanie pamięci
jest włączane automatycznie.
</Info>

Szczegółowe informacje o działaniu wyszukiwania, opcjach strojenia i konfiguracji dostawców znajdziesz w
dokumencie [Wyszukiwanie pamięci](/concepts/memory-search).

## Backendy pamięci

<CardGroup cols={3}>
<Card title="Wbudowany (domyślny)" icon="database" href="/concepts/memory-builtin">
Oparty na SQLite. Działa od razu z wyszukiwaniem słów kluczowych, podobieństwem wektorowym i
wyszukiwaniem hybrydowym. Bez dodatkowych zależności.
</Card>
<Card title="QMD" icon="search" href="/concepts/memory-qmd">
Lokalny sidecar z rerankingiem, rozwijaniem zapytań i możliwością indeksowania
katalogów spoza workspace.
</Card>
<Card title="Honcho" icon="brain" href="/concepts/memory-honcho">
Natywna dla AI pamięć między sesjami z modelowaniem użytkownika, wyszukiwaniem semantycznym i
świadomością wielu agentów. Instalacja pluginu.
</Card>
</CardGroup>

## Automatyczne opróżnianie pamięci

Zanim [kompaktowanie](/concepts/compaction) podsumuje rozmowę, OpenClaw
uruchamia cichą turę, która przypomina agentowi o zapisaniu ważnego kontekstu do plików
pamięci. Jest to włączone domyślnie — nie trzeba niczego konfigurować.

<Tip>
Opróżnianie pamięci zapobiega utracie kontekstu podczas kompaktowania. Jeśli agent ma
w rozmowie ważne fakty, które nie zostały jeszcze zapisane do pliku,
zostaną one automatycznie zapisane, zanim nastąpi podsumowanie.
</Tip>

## Dreaming (eksperymentalne)

Dreaming to opcjonalny przebieg konsolidacji pamięci w tle. Ponownie analizuje
krótkoterminowe przywołania z plików dziennych (`memory/YYYY-MM-DD.md`),
ocenia je i przenosi do pamięci długoterminowej (`MEMORY.md`) tylko elementy, które się kwalifikują.

Zaprojektowano go tak, aby utrzymywał wysoki stosunek sygnału do szumu w pamięci długoterminowej:

- **Opt-in**: domyślnie wyłączone.
- **Planowane**: po włączeniu `memory-core` automatycznie zarządza
  zadaniem cyklicznym.
- **Progowe**: przeniesienia muszą przejść progi oceny, częstotliwości przywołań i
  różnorodności zapytań.

Informacje o trybach działania (`off`, `core`, `rem`, `deep`), sygnałach oceny i opcjach strojenia
znajdziesz w dokumencie [Dreaming (eksperymentalne)](/concepts/memory-dreaming).

## CLI

```bash
openclaw memory status          # Sprawdź stan indeksu i dostawcę
openclaw memory search "query"  # Wyszukiwanie z wiersza poleceń
openclaw memory index --force   # Przebuduj indeks
```

## Dalsza lektura

- [Wbudowany silnik pamięci](/concepts/memory-builtin) — domyślny backend SQLite
- [Silnik pamięci QMD](/concepts/memory-qmd) — zaawansowany lokalny sidecar
- [Pamięć Honcho](/concepts/memory-honcho) — natywna dla AI pamięć między sesjami
- [Wyszukiwanie pamięci](/concepts/memory-search) — pipeline wyszukiwania, dostawcy i
  strojenie
- [Dreaming (eksperymentalne)](/concepts/memory-dreaming) — przenoszenie w tle
  z krótkoterminowego przywołania do pamięci długoterminowej
- [Dokumentacja konfiguracji pamięci](/reference/memory-config) — wszystkie opcje konfiguracji
- [Kompaktowanie](/concepts/compaction) — jak kompaktowanie współpracuje z pamięcią
