---
read_when:
    - Tworzenie klientów Matrix, które renderują bogate odpowiedzi OpenClaw
    - Debugowanie zawartości zdarzenia com.openclaw.presentation
summary: Metadane MessagePresentation Matrix dla klientów obsługujących OpenClaw
title: Metadane prezentacji Matrix
x-i18n:
    generated_at: "2026-05-10T19:22:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: c89979b6007faaa6af44c7f2511f354b96f163bcd3d5e7f99c405b51c4950537
    source_path: channels/matrix-presentation.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw może dołączać znormalizowane metadane `MessagePresentation` do wychodzących zdarzeń Matrix `m.room.message` w kluczu `com.openclaw.presentation`.

Standardowe klienty Matrix nadal renderują zwykły tekst `body`. Klienty świadome OpenClaw mogą odczytywać ustrukturyzowane metadane i renderować natywny interfejs użytkownika, taki jak przyciski, listy wyboru, wiersze kontekstu i separatory.

## Zawartość zdarzenia

Metadane są przechowywane w zawartości zdarzenia Matrix:

```json
{
  "msgtype": "m.text",
  "body": "Select model\n\n- DeepSeek: /model deepseek/deepseek-chat",
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

`version` to wersja schematu metadanych prezentacji Matrix. `type` to stabilny dyskryminator dla klientów świadomych OpenClaw. Klienty powinny ignorować nieznane wartości `type`, nieznane wersje, których nie mogą bezpiecznie zinterpretować, oraz nieznane typy bloków.

## Zachowanie zastępcze

OpenClaw zawsze renderuje czytelny zastępczy zwykły tekst w `body`. Ustrukturyzowane metadane są dodatkiem i nie mogą być wymagane do podstawowej interoperacyjności Matrix.

Nieobsługiwane klienty powinny nadal wyświetlać tekst zastępczy. Klienty świadome OpenClaw mogą preferować ustrukturyzowane metadane do wyświetlania, zachowując jednocześnie tekst zastępczy do kopiowania, wyszukiwania, powiadomień i dostępności.

## Obsługiwane bloki

Adapter wychodzący Matrix deklaruje obsługę:

- `buttons`
- `select`
- `context`
- `divider`

Klienty powinny traktować te bloki jako wskazówki prezentacji typu best-effort. Nieznane pola i nieznane typy bloków powinny być ignorowane, zamiast powodować niepowodzenie renderowania całej wiadomości.

## Interakcje

Te metadane nie dodają semantyki wywołań zwrotnych Matrix. Wartości przycisków i opcji wyboru są zastępczymi ładunkami interakcji, zwykle poleceniami ukośnikowymi lub poleceniami tekstowymi. Klient Matrix, który chce obsługiwać interakcję, może wysłać wybraną wartość z powrotem do pokoju jako normalną wiadomość.

Na przykład przycisk o wartości `/model deepseek/deepseek-chat` można obsłużyć przez wysłanie tej wartości jako zaszyfrowanej wiadomości tekstowej Matrix w tym samym pokoju.

## Relacja do metadanych zatwierdzania

`com.openclaw.presentation` służy do ogólnej prezentacji bogatych wiadomości.

Monity zatwierdzania używają dedykowanych metadanych `com.openclaw.approval`, ponieważ zatwierdzenia zawierają stan wrażliwy z punktu widzenia bezpieczeństwa, decyzje oraz szczegóły exec/Plugin. Jeśli oba klucze metadanych są obecne w tym samym zdarzeniu, klienty powinny preferować dedykowany renderer zatwierdzania.

## Wiadomości multimedialne

Gdy odpowiedź zawiera wiele adresów URL multimediów, OpenClaw wysyła jedno zdarzenie Matrix na każdy adres URL multimediów. Metadane prezentacji są dołączane tylko do pierwszego zdarzenia multimedialnego, aby klienty miały jeden stabilny ustrukturyzowany ładunek i aby uniknąć zduplikowanych rendererów.

Metadane prezentacji powinny pozostać zwięzłe. Duży tekst widoczny dla użytkownika powinien pozostać w `body` i używać normalnej ścieżki dzielenia tekstu Matrix.
