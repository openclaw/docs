---
read_when:
    - Musisz znaleźć coś, co omówiono we wcześniejszej sesji
    - Chcesz zrozumieć prywatność wyszukiwania sesji lub indeksowanie
summary: Przeszukuj transkrypcje poprzednich sesji i ponownie otwieraj pasujący kontekst
title: Wyszukiwanie sesji
x-i18n:
    generated_at: "2026-07-16T18:16:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3e9cda6b656b689eef0636592914f4890a64dca5e955aa03908377903aaa29c9
    source_path: concepts/session-search.md
    workflow: 16
---

# Wyszukiwanie sesji

`sessions_search` przeszukuje tekst użytkownika i asystenta we własnych wcześniejszych sesjach. Każdy wynik
zawiera `sessionKey`, znacznik czasu, rolę i krótki pasujący fragment. Przekaż zwrócony
`sessionKey` do `sessions_history`, gdy potrzebny jest otaczający kontekst rozmowy.

## Widoczność i dane wyjściowe

Wyszukiwanie używa tych samych reguł widoczności sesji co `sessions_history`. Wyniki spoza
drzewa sesji widocznego dla wywołującego są usuwane przed zastosowaniem limitów wyników. Agenci działający
w piaskownicy pozostają ograniczeni do sesji, które utworzyli, gdy włączona jest widoczność utworzonych sesji.

Fragmenty są redagowane przed zwróceniem ich do modelu. Wyniki są również ograniczone pod względem liczby, długości
fragmentów i łącznego rozmiaru odpowiedzi.

## Cykl życia indeksu

OpenClaw przechowuje indeks pełnotekstowy obok wierszy transkrypcji w bazie danych SQLite każdego agenta.
Nowe wiadomości użytkownika i asystenta są indeksowane w tej samej transakcji, która je utrwala, dzięki czemu
indeks nigdy nie pozostaje w tyle za bieżącymi rozmowami; wyniki narzędzi, bloki rozumowania i obrazy są wykluczone.
Można przeszukiwać tylko aktywną gałąź transkrypcji.

Transkrypcje sprzed utworzenia indeksu (na przykład sesje zaimportowane przez `openclaw doctor`) oraz
sesje, których aktywna gałąź została cofnięta, są ponownie indeksowane w ramach uzgadniania w tle, rozpoczynającego się
przy następnym wyszukiwaniu. Odpowiedź zawierająca `indexing: true` może zatem być niekompletna; ponów próbę po
zakończeniu indeksowania. Usunięcie sesji usuwa jej wpisy indeksu w tej samej transakcji.

Wyszukiwanie używa obecnie tokenizatora słów Unicode SQLite z usuwaniem znaków diakrytycznych. Tokenizacja trygramowa
do dopasowywania podciągów w językach CJK jest planowanym ulepszeniem.

## Wyszukiwanie sesji a wyszukiwanie w pamięci

Użyj `sessions_search` do wyszukiwania dokładnych słów lub fraz w nieprzetworzonych transkrypcjach sesji. Użyj
[`memory_search`](/pl/concepts/memory-search) do trwałych plików pamięci i przywoływania semantycznego.
Eksperymentalny korpus pamięci sesji stanowi semantyczne uzupełnienie tego dokładnego wyszukiwania w transkrypcjach.
