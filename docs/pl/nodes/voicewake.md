---
read_when:
    - Zmiana działania lub ustawień domyślnych słów aktywujących głosowo
    - Dodawanie nowych platform Node wymagających synchronizacji słowa wybudzającego
summary: Globalne słowa wybudzające głosem (zarządzane przez Gateway) i sposób ich synchronizacji między węzłami
title: Aktywacja głosowa
x-i18n:
    generated_at: "2026-07-16T18:42:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aef2a5bba664ce10fb6ab457bb6d202639dcc6c0a9df61567e7cb402c290bbec
    source_path: nodes/voicewake.md
    workflow: 16
---

Słowa aktywujące są **jedną globalną listą należącą do Gateway** — nie ma niestandardowych list dla poszczególnych węzłów. Każdy węzeł lub interfejs aplikacji może edytować listę; Gateway utrwala zmianę i rozsyła ją do wszystkich połączonych klientów.

- **macOS**: lokalny przełącznik włączania/wyłączania aktywacji głosowej. Wymaga systemu macOS 26+; szczegóły dotyczące środowiska uruchomieniowego/PTT zawiera sekcja [Aktywacja głosowa (macOS)](/pl/platforms/mac/voicewake).
- **iOS**: lokalny przełącznik włączania/wyłączania aktywacji głosowej w Settings.
- **Android**: lokalny przełącznik włączania/wyłączania aktywacji głosowej i edytor słów aktywujących w Settings → Voice. Wymaga rozpoznawania mowy na urządzeniu z systemem Android.

## Przechowywanie

Słowa aktywujące i reguły routingu znajdują się w bazie danych stanu Gateway, domyślnie `~/.openclaw/state/openclaw.sqlite` (można to zmienić za pomocą `OPENCLAW_STATE_DIR`), w tabelach `voicewake_triggers`, `voicewake_routing_config`, `voicewake_routing_routes`. Starsze `settings/voicewake.json` i `settings/voicewake-routing.json` służą wyłącznie jako dane wejściowe migracji `openclaw doctor --fix` — środowisko uruchomieniowe nigdy ich nie odczytuje.

## Protokół

### Lista wyzwalaczy

| Metoda          | Parametry                   | Wynik                   |
| --------------- | --------------------------- | ----------------------- |
| `voicewake.get` | brak                     | `{ triggers: string[] }` |
| `voicewake.set` | `{ triggers: string[] }` | `{ triggers: string[] }` |

`voicewake.set` normalizuje dane wejściowe: usuwa białe znaki z początku i końca, odrzuca puste wpisy, zachowuje najwyżej 32 wyzwalacze i skraca każdy z nich do 64 jednostek kodowych UTF-16 bez rozdzielania par surogatów. Pusty wynik powoduje użycie wbudowanych wartości domyślnych (`openclaw`, `claude`, `computer`).

### Routing (od wyzwalacza do celu)

| Metoda                  | Parametry                               | Wynik                               |
| ----------------------- | --------------------------------------- | ----------------------------------- |
| `voicewake.routing.get` | brak                                 | `{ config: VoiceWakeRoutingConfig }` |
| `voicewake.routing.set` | `{ config: VoiceWakeRoutingConfig }` | `{ config: VoiceWakeRoutingConfig }` |

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

Każdy `target` trasy obsługuje dokładnie jedną z następujących wartości:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

Limity: najwyżej 32 trasy, tekst wyzwalacza o długości najwyżej 64 znaków. Wyzwalacze tras są normalizowane na potrzeby dopasowywania i wykrywania duplikatów przez zmianę liter na małe, usuwanie początkowych i końcowych znaków interpunkcyjnych z każdego słowa oraz zwijanie białych znaków (`"Hey, Bot!!"` i `"hey bot"` są dopasowywane i uznawane za duplikaty) — jest to bardziej rygorystyczna normalizacja niż samo usuwanie białych znaków z początku i końca, stosowane powyżej dla globalnej listy wyzwalaczy.

### Zdarzenia

| Zdarzenie                   | Ładunek                              |
| --------------------------- | ------------------------------------ |
| `voicewake.changed`         | `{ triggers: string[] }`             |
| `voicewake.routing.changed` | `{ config: VoiceWakeRoutingConfig }` |

Oba są rozsyłane do każdego klienta WebSocket z zakresem odczytu (aplikacji macOS, WebChat i podobnych) oraz do każdego połączonego węzła. Węzeł otrzymuje również oba zdarzenia jako początkową migawkę bezpośrednio po połączeniu.

## Zachowanie klientów

- **macOS**: wywołuje `voicewake.set`/`voicewake.get` i nasłuchuje `voicewake.changed`, aby zachować synchronizację z innymi klientami.
- **iOS**: wywołuje `voicewake.set`/`voicewake.get` i nasłuchuje `voicewake.changed`, aby lokalne wykrywanie słów aktywujących reagowało bez opóźnień.
- **Android**: wywołuje `voicewake.set`/`voicewake.get`, nasłuchuje `voicewake.changed` i po włączeniu ogłasza `voiceWake`. Rozpoznawanie odbywa się na urządzeniu i tylko na pierwszym planie; zostaje wstrzymane, gdy Talk, ręczne dyktowanie, nagrywanie notatki głosowej lub odtwarzanie mowy z wiadomości korzysta z dźwięku.

## Powiązane materiały

- [Tryb Talk](/pl/nodes/talk)
- [Dźwięk i notatki głosowe](/pl/nodes/audio)
- [Rozumienie multimediów](/pl/nodes/media-understanding)
