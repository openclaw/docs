---
read_when:
    - Chcesz, aby OpenClaw pamiętał naturalne pytania uzupełniające
    - Chcesz zrozumieć, czym wywnioskowane zameldowania różnią się od przypomnień
    - Chcesz przejrzeć lub odrzucić zobowiązania do dalszych działań
sidebarTitle: Commitments
summary: Wywnioskowana pamięć działań następczych dla zgłoszeń kontrolnych, które nie są dokładnymi przypomnieniami
title: Wywnioskowane zobowiązania
x-i18n:
    generated_at: "2026-05-01T09:58:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78841d87fe749aa5b04a967218396df1c1a7884c5767b09215c96aee34fa2014
    source_path: concepts/commitments.md
    workflow: 16
---

Zobowiązania to krótkotrwałe pamięci działań następczych. Gdy są włączone, OpenClaw może zauważyć, że rozmowa stworzyła okazję do przyszłego sprawdzenia sytuacji, i zapamiętać, aby wrócić do niej później.

Przykłady:

- Wspominasz o jutrzejszej rozmowie kwalifikacyjnej. OpenClaw może odezwać się po niej.
- Mówisz, że jesteś wyczerpany. OpenClaw może później zapytać, czy udało ci się przespać.
- Agent mówi, że wróci do tematu po zmianie sytuacji. OpenClaw może śledzić tę otwartą pętlę.

Zobowiązania nie są trwałymi faktami takimi jak `MEMORY.md` i nie są dokładnymi przypomnieniami. Znajdują się między pamięcią a automatyzacją: OpenClaw zapamiętuje zobowiązanie powiązane z rozmową, a następnie Heartbeat dostarcza je, gdy nadejdzie termin.

## Włącz zobowiązania

Zobowiązania są domyślnie wyłączone. Włącz je w konfiguracji:

```bash
openclaw config set commitments.enabled true
openclaw config set commitments.maxPerDay 3
```

Równoważny `openclaw.json`:

```json
{
  "commitments": {
    "enabled": true,
    "maxPerDay": 3
  }
}
```

`commitments.maxPerDay` ogranicza liczbę wywnioskowanych działań następczych, które można dostarczyć na sesję agenta w kroczącym dniu. Wartość domyślna to `3`.

## Jak to działa

Po odpowiedzi agenta OpenClaw może uruchomić ukryty przebieg wyodrębniania w tle w osobnym kontekście. Ten przebieg szuka wyłącznie wywnioskowanych zobowiązań do działań następczych. Nie zapisuje niczego w widocznej rozmowie i nie prosi głównego agenta o rozumowanie na temat wyodrębniania.

Gdy znajdzie kandydata o wysokiej pewności, OpenClaw zapisuje zobowiązanie z:

- identyfikatorem agenta
- kluczem sesji
- pierwotnym kanałem i celem dostarczenia
- oknem terminu
- krótką sugerowaną wiadomością kontrolną
- metadanymi niebędącymi instrukcjami, których Heartbeat używa do decyzji, czy je wysłać

Dostarczenie odbywa się przez Heartbeat. Gdy nadchodzi termin zobowiązania, Heartbeat dodaje zobowiązanie do tury Heartbeat dla tego samego agenta i zakresu kanału. Model może wysłać jedną naturalną wiadomość kontrolną albo odpowiedzieć `HEARTBEAT_OK`, aby ją odrzucić. Jeśli Heartbeat jest skonfigurowany z `target: "none"`, zobowiązania z nadejściem terminu pozostają wewnętrzne i nie wysyłają zewnętrznych wiadomości kontrolnych. Prompty dostarczania zobowiązań nie odtwarzają pierwotnego tekstu rozmowy, a tury Heartbeat dla zobowiązań z nadejściem terminu działają bez narzędzi OpenClaw.

OpenClaw nigdy nie dostarcza wywnioskowanego zobowiązania natychmiast po jego zapisaniu. Termin jest ograniczany do co najmniej jednego interwału Heartbeat po utworzeniu zobowiązania, więc działanie następcze nie może wrócić echem w tej samej chwili, w której zostało wywnioskowane.

## Zakres

Zobowiązania są ograniczone do dokładnego kontekstu agenta i kanału, w którym zostały utworzone. Działanie następcze wywnioskowane podczas rozmowy z jednym agentem w Discord nie zostanie dostarczone przez innego agenta, inny kanał ani niepowiązaną sesję.

Ten zakres jest częścią funkcji. Naturalne wiadomości kontrolne powinny sprawiać wrażenie kontynuacji tej samej rozmowy, a nie globalnego systemu przypomnień.

## Zobowiązania a przypomnienia

| Potrzeba                                        | Użyj                                     |
| ----------------------------------------------- | ---------------------------------------- |
| „Przypomnij mi o 15:00”                         | [Zaplanowane zadania](/pl/automation/cron-jobs) |
| „Daj mi znać za 20 minut”                       | [Zaplanowane zadania](/pl/automation/cron-jobs) |
| „Uruchamiaj ten raport w każdy dzień roboczy”   | [Zaplanowane zadania](/pl/automation/cron-jobs) |
| „Mam jutro rozmowę kwalifikacyjną”              | Zobowiązania                             |
| „Nie spałem całą noc”                           | Zobowiązania                             |
| „Wróć do tematu, jeśli nie odpowiem w tym otwartym wątku” | Zobowiązania                  |

Dokładne prośby użytkownika już należą do ścieżki harmonogramu. Zobowiązania służą wyłącznie do wywnioskowanych działań następczych: sytuacji, w których użytkownik nie poprosił o przypomnienie, ale rozmowa wyraźnie stworzyła użyteczną okazję do przyszłego sprawdzenia sytuacji.

## Zarządzaj zobowiązaniami

Użyj CLI, aby sprawdzać i usuwać zapisane zobowiązania:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Zobacz [`openclaw commitments`](/pl/cli/commitments), aby poznać opis polecenia.

## Prywatność i koszt

Wyodrębnianie zobowiązań używa przebiegu LLM, więc jego włączenie dodaje użycie modelu w tle po kwalifikujących się turach. Ten przebieg jest ukryty przed rozmową widoczną dla użytkownika, ale może odczytać niedawną wymianę potrzebną do ustalenia, czy istnieje działanie następcze.

Zapisane zobowiązania są lokalnym stanem OpenClaw. Są pamięcią operacyjną, a nie pamięcią długoterminową. Wyłącz funkcję za pomocą:

```bash
openclaw config set commitments.enabled false
```

## Rozwiązywanie problemów

Jeśli oczekiwane działania następcze się nie pojawiają:

- Potwierdź, że `commitments.enabled` ma wartość `true`.
- Sprawdź `openclaw commitments --all`, aby znaleźć rekordy oczekujące, odrzucone, odłożone lub wygasłe.
- Upewnij się, że Heartbeat działa dla agenta.
- Sprawdź, czy limit `commitments.maxPerDay` nie został już osiągnięty dla tej sesji agenta.
- Pamiętaj, że dokładne przypomnienia są pomijane przez wyodrębnianie zobowiązań i zamiast tego powinny pojawiać się w [zaplanowanych zadaniach](/pl/automation/cron-jobs).

## Powiązane

- [Przegląd pamięci](/pl/concepts/memory)
- [Active Memory](/pl/concepts/active-memory)
- [Heartbeat](/pl/gateway/heartbeat)
- [Zaplanowane zadania](/pl/automation/cron-jobs)
- [`openclaw commitments`](/pl/cli/commitments)
- [Informacje o konfiguracji](/pl/gateway/configuration-reference#commitments)
