---
read_when:
    - Tworzenie klientów Matrix renderujących rozbudowane odpowiedzi OpenClaw
    - Debugowanie zawartości zdarzenia com.openclaw.presentation
summary: Metadane Matrix MessagePresentation dla klientów obsługujących OpenClaw
title: Metadane prezentacji Matrix
x-i18n:
    generated_at: "2026-07-12T14:53:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0de4d13c6cefc6f91dcc7a4b0edeea6bf001f3bd71f52c9f0498ad422783d8a
    source_path: channels/matrix-presentation.md
    workflow: 16
---

OpenClaw dołącza znormalizowane metadane `MessagePresentation` do wychodzących zdarzeń Matrix `m.room.message` pod kluczem zawartości `com.openclaw.presentation`.

Standardowe klienty Matrix nadal renderują zwykły tekst z pola `body`. Klienty obsługujące OpenClaw mogą odczytywać metadane strukturalne i renderować natywny interfejs użytkownika, taki jak przyciski, listy wyboru, wiersze kontekstowe i separatory.

## Zawartość zdarzenia

```json
{
  "msgtype": "m.text",
  "body": "Select model\n\nChoose model:\n- DeepSeek",
  "com.openclaw.presentation": {
    "version": 1,
    "type": "message.presentation",
    "title": "Select model",
    "tone": "info",
    "blocks": [
      {
        "type": "select",
        "placeholder": "Choose model",
        "options": [
          {
            "label": "DeepSeek",
            "value": "/model deepseek/deepseek-chat"
          }
        ]
      }
    ]
  }
}
```

- `version` to wersja schematu metadanych; bieżąca wersja to `1`. `type` jest stabilnym dyskryminatorem, zawsze równym `"message.presentation"`. Adapter Matrix emituje wyłącznie ładunki o dokładnie tej wersji i tym typie; klienty powinny analogicznie ignorować nieznane wersje, których nie mogą bezpiecznie interpretować, nieznane wartości `type` oraz nieznane typy bloków.
- `title` i `tone` (`info`, `success`, `warning`, `danger`, `neutral`) są opcjonalnymi wskazówkami.
- Przyciski i opcje wyboru mogą zawierać typowaną właściwość `action` (`{ "type": "command", "command": "/..." }` lub `{ "type": "callback", "value": "..." }`) obok starszej wartości tekstowej `value`. Gdy występują obie, preferuj `action`.

## Zachowanie awaryjne

OpenClaw zawsze renderuje w polu `body` czytelną reprezentację awaryjną w postaci zwykłego tekstu. Metadane strukturalne są dodatkiem i nie mogą być wymagane do podstawowej interoperacyjności z Matrix.

Reguły renderowania awaryjnego:

- Zawartość `title`, `text` i `context` jest renderowana jako zwykłe wiersze.
- Przyciski z akcją `command` są renderowane jako ``etykieta: `/command` ``, aby polecenie można było skopiować. Przyciski z akcją `callback` lub wyłącznie starszą wartością `value` są renderowane tylko jako etykieta, aby niejawne wartości wywołań zwrotnych pozostały prywatne; wyłączone przyciski są zawsze renderowane tylko jako etykieta. Przyciski adresów URL i aplikacji internetowych są renderowane jako `etykieta: URL`.
- Bloki wyboru renderują tekst zastępczy (lub `Opcje:`) jako nagłówek oraz wiersze opcji zawierające wyłącznie etykiety.
- Jeśli nic nie zostanie wyrenderowane, na przykład w prezentacji zawierającej wyłącznie separator, treścią awaryjną będzie `---`.

Nieobsługiwane klienty nadal wyświetlają tekst awaryjny. Klienty obsługujące OpenClaw mogą preferować metadane strukturalne do wyświetlania, zachowując tekst awaryjny na potrzeby kopiowania, wyszukiwania, powiadomień i ułatwień dostępu.

## Obsługiwane bloki

Adapter wychodzący Matrix deklaruje natywną obsługę następujących typów:

- `buttons`
- `select`
- `context`
- `divider`

Bloki `text` są zawsze obsługiwane za pośrednictwem treści awaryjnej. Wszystkie bloki należy traktować jako opcjonalne wskazówki dotyczące prezentacji; zamiast odrzucać całą wiadomość, należy ignorować nieznane pola i typy bloków.

## Interakcje

Te metadane nie dodają semantyki wywołań zwrotnych Matrix. Wartości przycisków i opcji wyboru są awaryjnymi ładunkami interakcji, zazwyczaj poleceniami z ukośnikiem lub poleceniami tekstowymi. Klient Matrix, który chce obsługiwać interakcje, ustala wartość elementu sterującego (`action.command`, następnie `action.value`, a następnie `value`) i wysyła ją z powrotem do pokoju jako zwykłą wiadomość.

Na przykład przycisk o wartości `/model deepseek/deepseek-chat` można obsłużyć, wysyłając tę wartość jako zaszyfrowaną wiadomość tekstową Matrix w tym samym pokoju.

## Relacja z metadanymi zatwierdzania

`com.openclaw.presentation` służy do ogólnej prezentacji rozbudowanych wiadomości.

Monity o zatwierdzenie używają dedykowanych metadanych `com.openclaw.approval`, ponieważ zatwierdzenia zawierają stan istotny dla bezpieczeństwa, decyzje oraz szczegóły wykonania i Pluginów. Jeśli oba klucze metadanych występują w tym samym zdarzeniu, klienty powinny preferować dedykowany mechanizm renderowania zatwierdzeń.

## Wiadomości multimedialne

Gdy odpowiedź zawiera wiele adresów URL multimediów, OpenClaw wysyła po jednym zdarzeniu Matrix dla każdego adresu URL. Tekst podpisu i metadane prezentacji są dołączane wyłącznie do pierwszego zdarzenia, dzięki czemu klienty otrzymują jeden stabilny ładunek strukturalny bez powielonych mechanizmów renderowania. Ta sama reguła obowiązuje, gdy długi tekst jest dzielony między zdarzenia: metadane są przesyłane wyłącznie w pierwszym zdarzeniu.

Metadane prezentacji powinny być zwarte. Obszerny tekst widoczny dla użytkownika powinien pozostać w polu `body` i korzystać ze standardowego mechanizmu dzielenia tekstu Matrix.
