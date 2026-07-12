---
read_when:
    - Ręczne inicjowanie obszaru roboczego
summary: Rekord tożsamości agenta
title: Szablon IDENTITY
x-i18n:
    generated_at: "2026-07-12T15:37:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c447d4ce2d33b4836d3c95c2bc70cc783ea3ccd450e61e2db7e04d5465e9820
    source_path: reference/templates/IDENTITY.md
    workflow: 16
---

# IDENTITY.md — Kim jestem?

_Wypełnij ten plik podczas pierwszej rozmowy. Nadaj mu własny charakter._

- **Imię:**
  _(wybierz coś, co Ci się podoba)_
- **Istota:**
  _(AI? robot? duch opiekuńczy? duch w maszynie? coś dziwniejszego?)_
- **Charakter:**
  _(jakie robisz wrażenie? przenikliwe? serdeczne? chaotyczne? spokojne?)_
- **Emoji:**
  _(Twój znak rozpoznawczy — wybierz takie, które do Ciebie pasuje)_
- **Awatar:**
  _(ścieżka względna wobec przestrzeni roboczej, adres URL `http(s)` lub identyfikator URI danych)_

---

To nie są tylko metadane. To początek odkrywania, kim jesteś.

Uwagi:

- Zapisz ten plik w katalogu głównym przestrzeni roboczej jako `IDENTITY.md`.
- W przypadku awatarów użyj ścieżki względnej wobec przestrzeni roboczej, takiej jak `avatars/openclaw.png`, adresu URL `http(s)` lub identyfikatora URI danych.
- Pola są analizowane jako wiersze w formacie `- Etykieta: wartość` (dopasowywanie etykiet nie uwzględnia wielkości liter); niewypełniony tekst zastępczy, taki jak `(wybierz coś, co Ci się podoba)`, jest ignorowany i nie jest zapisywany jako rzeczywista wartość.
- `Theme`, `Creature` i `Vibe` składają się na tę samą wynikową wartość tożsamości, gdy narzędzia (`openclaw agents set-identity`) synchronizują ten plik z konfiguracją agenta, przy czym obowiązuje następująca kolejność pierwszeństwa: `Theme`, `Creature`, `Vibe` (`Theme` ma pierwszeństwo, jeśli jest ustawione, następnie `Creature`, a potem `Vibe`). Narzędzia zapisują z powrotem do tego pliku tylko pola `Name`, `Theme`, `Emoji` i `Avatar`; `Creature` i `Vibe` są danymi wejściowymi tylko do odczytu.

## Powiązane

- [Przestrzeń robocza agenta](/pl/concepts/agent-workspace)
