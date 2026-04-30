---
read_when:
    - Chcesz, aby OpenClaw pamiętał naturalne kontynuacje
    - Chcesz zrozumieć, czym wywnioskowane zgłoszenia kontrolne różnią się od przypomnień
    - Chcesz przejrzeć lub odrzucić zobowiązania dotyczące dalszych działań
sidebarTitle: Commitments
summary: Wywnioskowana pamięć działań następczych dla zgłoszeń kontrolnych, które nie są dokładnymi przypomnieniami
title: Wywnioskowane zobowiązania
x-i18n:
    generated_at: "2026-04-30T09:46:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f51af0ac2c9841258fbeeb8f2f98dba6f438b8e0c9433f601a0504d6ef27111
    source_path: concepts/commitments.md
    workflow: 16
---

Zobowiązania to krótkotrwałe pamięci dotyczące działań następczych. Po ich włączeniu OpenClaw może
zauważyć, że rozmowa utworzyła przyszłą okazję do kontaktu kontrolnego, i zapamiętać,
aby wrócić do niej później.

Przykłady:

- Wspominasz o jutrzejszej rozmowie kwalifikacyjnej. OpenClaw może odezwać się po niej.
- Mówisz, że jesteś wyczerpany. OpenClaw może później zapytać, czy udało Ci się przespać.
- Agent mówi, że wróci do sprawy po zmianie sytuacji. OpenClaw może śledzić
  tę otwartą pętlę.

Zobowiązania nie są trwałymi faktami jak `MEMORY.md` i nie są dokładnymi
przypomnieniami. Znajdują się pomiędzy pamięcią a automatyzacją: OpenClaw zapamiętuje
zobowiązanie powiązane z rozmową, a następnie Heartbeat dostarcza je, gdy nadejdzie termin.

## Włącz zobowiązania

Zobowiązania są domyślnie wyłączone. Włącz je w konfiguracji:

```bash
openclaw config set commitments.enabled true
openclaw config set commitments.maxPerDay 3
```

Odpowiednik w `openclaw.json`:

```json
{
  "commitments": {
    "enabled": true,
    "maxPerDay": 3
  }
}
```

`commitments.maxPerDay` ogranicza liczbę wywnioskowanych działań następczych, które mogą zostać dostarczone
w ramach jednej sesji agenta w ruchomym okresie dobowym. Wartość domyślna to `3`.

## Jak to działa

Po odpowiedzi agenta OpenClaw może uruchomić ukryte, działające w tle przejście ekstrakcji w
oddzielnym kontekście. To przejście szuka tylko wywnioskowanych zobowiązań do działań następczych. Nie
zapisuje niczego w widocznej rozmowie i nie prosi głównego agenta
o rozumowanie dotyczące ekstrakcji.

Gdy znajdzie kandydata o wysokiej pewności, OpenClaw zapisuje zobowiązanie z:

- identyfikatorem agenta
- kluczem sesji
- oryginalnym kanałem i celem dostarczenia
- oknem terminu
- krótką sugerowaną wiadomością kontrolną
- wystarczającym kontekstem źródłowym, aby Heartbeat mógł zdecydować, czy ją wysłać

Dostarczenie odbywa się przez Heartbeat. Gdy zobowiązanie osiągnie termin, Heartbeat
dodaje je do tury Heartbeat dla tego samego agenta i zakresu kanału.
Model może wysłać jedną naturalną wiadomość kontrolną albo odpowiedzieć `HEARTBEAT_OK`, aby ją odrzucić.

OpenClaw nigdy nie dostarcza wywnioskowanego zobowiązania natychmiast po jego zapisaniu.
Termin jest ograniczany do co najmniej jednego interwału Heartbeat po utworzeniu zobowiązania,
dzięki czemu działanie następcze nie może wrócić echem w tej samej chwili, w której zostało
wywnioskowane.

## Zakres

Zobowiązania są ograniczone do dokładnego kontekstu agenta i kanału, w którym zostały
utworzone. Działanie następcze wywnioskowane podczas rozmowy z jednym agentem w Discord nie jest
dostarczane przez innego agenta, inny kanał ani niepowiązaną sesję.

Ten zakres jest częścią funkcji. Naturalne wiadomości kontrolne powinny sprawiać wrażenie kontynuacji tej samej
rozmowy, a nie globalnego systemu przypomnień.

## Zobowiązania a przypomnienia

| Potrzeba                                        | Użyj                                      |
| ----------------------------------------------- | ---------------------------------------- |
| "Przypomnij mi o 15:00"                         | [Zaplanowane zadania](/pl/automation/cron-jobs) |
| "Odezwij się do mnie za 20 minut"               | [Zaplanowane zadania](/pl/automation/cron-jobs) |
| "Uruchamiaj ten raport w każdy dzień roboczy"   | [Zaplanowane zadania](/pl/automation/cron-jobs) |
| "Mam jutro rozmowę kwalifikacyjną"              | Zobowiązania                             |
| "Nie spałem całą noc"                           | Zobowiązania                             |
| "Wróć do sprawy, jeśli nie odpowiem w tym otwartym wątku" | Zobowiązania                             |

Dokładne żądania użytkownika należą już do ścieżki harmonogramu. Zobowiązania są przeznaczone tylko
dla wywnioskowanych działań następczych: momentów, w których użytkownik nie poprosił o przypomnienie,
ale rozmowa wyraźnie utworzyła przydatną przyszłą okazję do kontaktu kontrolnego.

## Zarządzaj zobowiązaniami

Użyj CLI, aby sprawdzać i usuwać zapisane zobowiązania:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Zobacz [`openclaw commitments`](/pl/cli/commitments), aby uzyskać dokumentację polecenia.

## Prywatność i koszt

Ekstrakcja zobowiązań używa przejścia LLM, więc jej włączenie dodaje użycie modelu w tle
po kwalifikujących się turach. Przejście jest ukryte przed rozmową widoczną dla użytkownika,
ale może odczytać ostatnią wymianę potrzebną do zdecydowania, czy istnieje
działanie następcze.

Zapisane zobowiązania są lokalnym stanem OpenClaw. Są pamięcią operacyjną, a nie
pamięcią długoterminową. Wyłącz funkcję za pomocą:

```bash
openclaw config set commitments.enabled false
```

## Rozwiązywanie problemów

Jeśli oczekiwane działania następcze się nie pojawiają:

- Potwierdź, że `commitments.enabled` ma wartość `true`.
- Sprawdź `openclaw commitments --all` pod kątem rekordów oczekujących, odrzuconych, odłożonych lub wygasłych.
- Upewnij się, że Heartbeat działa dla agenta.
- Sprawdź, czy `commitments.maxPerDay` nie został już osiągnięty dla tej
  sesji agenta.
- Pamiętaj, że dokładne przypomnienia są pomijane przez ekstrakcję zobowiązań i powinny
  zamiast tego pojawić się w [zaplanowanych zadaniach](/pl/automation/cron-jobs).

## Powiązane

- [Omówienie pamięci](/pl/concepts/memory)
- [Active Memory](/pl/concepts/active-memory)
- [Heartbeat](/pl/gateway/heartbeat)
- [Zaplanowane zadania](/pl/automation/cron-jobs)
- [`openclaw commitments`](/pl/cli/commitments)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#commitments)
