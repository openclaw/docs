---
read_when:
    - Publikowanie umiejętności lub Pluginu
    - Debugowanie błędów zakresu właściciela lub pakietu
    - Dodawanie interfejsu użytkownika, CLI lub zachowania backendu dla publikowania
summary: Jak działa publikowanie w ClawHub dla Skills, pluginów, właścicieli, zakresów, wydań i przeglądu.
x-i18n:
    generated_at: "2026-05-10T19:26:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 61de013f0ac82acbf20f99c3e0c92c8e31d3de14e9ee64f7bc7659d522747089
    source_path: clawhub/publishing.md
    workflow: 16
---

# Publikowanie

Publikowanie w ClawHub jest ograniczone do właściciela: każda publikacja wskazuje wydawcę, a serwer decyduje, czy zalogowany użytkownik może tam publikować.

## Właściciele

Właściciel to uchwyt wydawcy ClawHub, taki jak `@alice` lub `@openclaw`.
Właściciele osobisti są tworzeni dla użytkowników. Właściciele organizacyjni mogą mieć wielu członków.

Podczas publikowania używasz swojego osobistego właściciela albo wybierasz właściciela organizacyjnego, u którego masz dostęp wydawcy.

## Skills

Skills są publikowane z folderu Skills. Strona publiczna to:

```text
https://clawhub.ai/<owner>/<slug>
```

Przykład:

```text
https://clawhub.ai/alice/review-helper
```

Żądanie publikacji zawiera wybranego właściciela, slug, wersję, dziennik zmian i pliki. Serwer sprawdza, czy aktor może publikować jako ten właściciel, zanim utworzy wydanie.

Aby przenieść istniejące Skills do innego właściciela podczas publikowania nowej wersji, wybierz nowego właściciela i wyraźnie potwierdź przeniesienie własności. W CLI/API przekaż docelowego właściciela oraz zgodę na migrację:

```sh
clawhub skill publish ./review-helper --owner openclaw --migrate-owner --version 1.2.0
```

Migracja właściciela Skills wymaga dostępu administratora lub właściciela zarówno u obecnego właściciela, jak i u właściciela docelowego. Zachowuje Skills, historię wersji, statystyki, komentarze, forki, aliasy i ścieżkę audytu; stare adresy URL właściciela nadal działają przez ścieżkę aliasu/przekierowania.

## Pluginy

Pluginy używają nazw pakietów w stylu npm. Nazwy pakietów z zakresem zawierają właściciela w pierwszej części nazwy:

```text
@owner/package-name
```

Zakres musi odpowiadać wybranemu właścicielowi publikacji. Jeśli Twój pakiet nazywa się `@openclaw/dronzer`, może zostać opublikowany tylko jako `@openclaw`. Jeśli publikujesz jako `@vintageayu`, zmień nazwę pakietu na `@vintageayu/dronzer`.

Zapobiega to sytuacji, w której pakiet rości sobie prawa do przestrzeni nazw organizacji, nad którą wydawca nie ma kontroli.

## Przebieg wydania

1. UI, CLI lub workflow GitHub zbiera metadane pakietu i pliki.
2. Żądanie publikacji jest wysyłane do ClawHub z wybranym właścicielem.
3. Serwer sprawdza uprawnienia właściciela, zakres pakietu, nazwę pakietu, wersję, limity plików i metadane źródła.
4. ClawHub zapisuje wydanie i uruchamia automatyczne kontrole bezpieczeństwa.
5. Nowe wydania są ukryte przed normalnymi powierzchniami instalowania/pobierania do czasu zakończenia przeglądu i weryfikacji.

Jeśli walidacja się nie powiedzie, wydanie nie zostanie utworzone.

## FAQ

### Zakres pakietu musi odpowiadać wybranemu właścicielowi

Jeśli zakres pakietu i wybrany właściciel nie są zgodne, ClawHub odrzuca publikację:

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

Aby to naprawić, wybierz właściciela wskazanego przez zakres pakietu albo zmień nazwę pakietu tak, aby zakres odpowiadał właścicielowi, jako którego możesz publikować.

Jeśli nazwa pakietu ma już właściwy zakres, ale pakiet należy do niewłaściwego wydawcy, zamiast tego przenieś własność:

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

Używaj przeniesienia pakietu tylko wtedy, gdy masz dostęp administratora zarówno do obecnego właściciela pakietu, jak i do wydawcy docelowego. Nie pozwala to publikować w zakresie, którym nie możesz zarządzać.

Chroni to przestrzenie nazw organizacji. Pakiet o nazwie `@openclaw/dronzer` rości sobie prawa do przestrzeni nazw `@openclaw`, więc publikować go mogą tylko wydawcy z dostępem do właściciela `@openclaw`.
