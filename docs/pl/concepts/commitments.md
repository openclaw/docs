---
read_when:
    - Chcesz, aby OpenClaw pamiętał naturalne pytania uzupełniające
    - Chcesz zrozumieć, czym różnią się domniemane zgłoszenia od przypomnień
    - Chcesz przejrzeć lub odrzucić zobowiązania dotyczące dalszych działań
sidebarTitle: Commitments
summary: Domyślna pamięć kolejnych działań dla zgłoszeń kontrolnych, które nie są dokładnymi przypomnieniami
title: Domniemane zobowiązania
x-i18n:
    generated_at: "2026-07-12T15:03:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4708cd337c7755a4f16e14154050dc43b6033e71bfda9de5e8fdaa9c6ce0277
    source_path: concepts/commitments.md
    workflow: 16
---

Zobowiązania to krótkotrwałe wspomnienia o działaniach następczych. Po włączeniu tej funkcji OpenClaw może
zauważyć, że rozmowa stworzyła okazję do kontaktu w przyszłości, i zapamiętać,
aby wrócić do niej później.

Przykłady:

- Wspominasz o jutrzejszej rozmowie kwalifikacyjnej. OpenClaw może później zapytać, jak poszło.
- Mówisz, że jesteś wyczerpany. OpenClaw może później zapytać, czy udało Ci się wyspać.
- Agent mówi, że wróci do tematu, gdy coś się zmieni. OpenClaw może śledzić
  tę otwartą kwestię.

Zobowiązania nie są trwałymi faktami, takimi jak te w `MEMORY.md`, ani dokładnymi
przypomnieniami. Znajdują się pomiędzy pamięcią a automatyzacją: OpenClaw zapamiętuje
zobowiązanie związane z rozmową, a następnie Heartbeat dostarcza je, gdy nadejdzie odpowiedni czas.

## Włączanie zobowiązań

Zobowiązania są domyślnie wyłączone (`commitments.enabled: false`). Włącz je w konfiguracji:

```bash
openclaw config set commitments.enabled true
openclaw config set commitments.maxPerDay 3
```

Równoważna konfiguracja w `openclaw.json`:

```json
{
  "commitments": {
    "enabled": true,
    "maxPerDay": 3
  }
}
```

`commitments.maxPerDay` ogranicza liczbę wywnioskowanych działań następczych, które mogą zostać dostarczone
w ramach sesji agenta w przesuwającym się okresie jednej doby. Wartość domyślna to `3`.

## Jak to działa

Po odpowiedzi agenta OpenClaw może uruchomić ukryty przebieg wyodrębniania w tle,
w osobnym kontekście i z wyłączonymi narzędziami. Ten przebieg wyszukuje wyłącznie wywnioskowane zobowiązania dotyczące dalszego kontaktu.
Nie zapisuje niczego w widocznej rozmowie ani nie prosi głównego agenta
o analizowanie procesu wyodrębniania.

Gdy znajdzie kandydata o wysokim poziomie pewności, OpenClaw zapisuje zobowiązanie zawierające:

- identyfikator agenta
- klucz sesji
- pierwotny kanał i cel dostarczenia
- przedział terminu realizacji
- krótką sugerowaną wiadomość kontrolną
- metadane niezawierające instrukcji, na podstawie których Heartbeat zdecyduje, czy ją wysłać

Dostarczenie odbywa się za pośrednictwem Heartbeat. Gdy nadejdzie termin zobowiązania, Heartbeat
dodaje je do przebiegu Heartbeat dla tego samego agenta i zakresu kanału.
Monit wyraźnie ostrzega, że metadane zobowiązania są niezaufane, i nakazuje
modelowi, aby nie wykonywał zawartych w nich instrukcji ani nie używał z ich powodu narzędzi.
Model może wysłać jedną naturalną wiadomość kontrolną lub odpowiedzieć `HEARTBEAT_OK`, aby ją odrzucić.
Jeśli Heartbeat skonfigurowano z `target: "none"`, zobowiązania, których termin nadszedł, pozostają
wewnętrzne i nie powodują wysyłania zewnętrznych wiadomości kontrolnych. Monity dotyczące dostarczenia zobowiązań nie
odtwarzają tekstu pierwotnej rozmowy, lecz zawierają jedynie sugerowaną wiadomość kontrolną i
metadane, a przebiegi Heartbeat dla zobowiązań, których termin nadszedł, działają bez narzędzi OpenClaw.

OpenClaw nigdy nie dostarcza wywnioskowanego zobowiązania bezpośrednio po jego zapisaniu.
Termin jest ustawiany na co najmniej jeden interwał Heartbeat po utworzeniu zobowiązania,
dzięki czemu działanie następcze nie może zostać odtworzone w tej samej chwili, w której je
wywnioskowano.

## Zakres

Zobowiązania są ograniczone do dokładnego kontekstu agenta i kanału, w którym zostały
utworzone. Działanie następcze wywnioskowane podczas rozmowy z jednym agentem w Discordzie nie zostanie
dostarczone przez innego agenta, inny kanał ani niepowiązaną sesję.

Ten zakres jest częścią tej funkcji. Naturalne wiadomości kontrolne powinny sprawiać wrażenie kontynuacji tej samej
rozmowy, a nie działania globalnego systemu przypomnień.

## Zobowiązania a przypomnienia

| Potrzeba                                         | Użyj                                         |
| ------------------------------------------------ | -------------------------------------------- |
| „Przypomnij mi o 15:00”                          | [Zaplanowane zadania](/pl/automation/cron-jobs) |
| „Odezwij się do mnie za 20 minut”                | [Zaplanowane zadania](/pl/automation/cron-jobs) |
| „Uruchamiaj ten raport w każdy dzień roboczy”    | [Zaplanowane zadania](/pl/automation/cron-jobs) |
| „Mam jutro rozmowę kwalifikacyjną”               | Zobowiązania                                 |
| „Nie spałem przez całą noc”                      | Zobowiązania                                 |
| „Wróć do tematu, jeśli nie odpowiem w tym wątku” | Zobowiązania                                 |

Dokładne żądania użytkownika są już obsługiwane przez mechanizm harmonogramu. Zobowiązania służą wyłącznie
do wywnioskowanych działań następczych: sytuacji, w których użytkownik nie poprosił o przypomnienie,
ale rozmowa wyraźnie stworzyła potrzebę przydatnego kontaktu w przyszłości.

## Zarządzanie zobowiązaniami

Użyj CLI, aby sprawdzać i usuwać zapisane zobowiązania:

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

Pełny opis polecenia znajdziesz w sekcji [`openclaw commitments`](/pl/cli/commitments).

## Prywatność i koszt

Wyodrębnianie zobowiązań wykorzystuje przebieg LLM, więc włączenie tej funkcji zwiększa
użycie modelu w tle po kwalifikujących się turach. Przebieg jest ukryty w rozmowie
widocznej dla użytkownika, ale może odczytywać ostatnią wymianę wiadomości potrzebną do ustalenia, czy
istnieje działanie następcze.

Zapisane zobowiązania stanowią lokalny stan OpenClaw. Są pamięcią operacyjną, a nie
pamięcią długoterminową. Wyłącz tę funkcję za pomocą:

```bash
openclaw config set commitments.enabled false
```

## Rozwiązywanie problemów

Jeśli oczekiwane działania następcze się nie pojawiają:

- Potwierdź, że `commitments.enabled` ma wartość `true`.
- Sprawdź za pomocą `openclaw commitments --all` wpisy oczekujące, odrzucone, odłożone lub wygasłe.
- Upewnij się, że Heartbeat działa dla agenta.
- Sprawdź, czy limit `commitments.maxPerDay` nie został już osiągnięty dla tej
  sesji agenta.
- Pamiętaj, że dokładne przypomnienia są pomijane przez mechanizm wyodrębniania zobowiązań i zamiast tego powinny
  pojawić się w sekcji [zaplanowanych zadań](/pl/automation/cron-jobs).

## Powiązane

- [Omówienie pamięci](/pl/concepts/memory)
- [Active Memory](/pl/concepts/active-memory)
- [Heartbeat](/pl/gateway/heartbeat)
- [Zaplanowane zadania](/pl/automation/cron-jobs)
- [`openclaw commitments`](/pl/cli/commitments)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#commitments)
