---
read_when:
    - Zmiana zachowania lub wartości domyślnych słów wybudzających sterowania głosowego
    - Dodawanie nowych platform Node wymagających synchronizacji frazy wybudzającej
summary: Globalne słowa wybudzania głosem (należące do Gateway) i sposób ich synchronizacji między węzłami
title: Wybudzanie głosowe
x-i18n:
    generated_at: "2026-06-27T17:45:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c57955e8061eca2f9fec83500e829f183cd3ef9f794bf385823a28f9c89b0a4
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw traktuje **słowa wybudzające jako jedną globalną listę**, której właścicielem jest **Gateway**.

- Nie ma **niestandardowych słów wybudzających dla poszczególnych węzłów**.
- **Interfejs dowolnego węzła/aplikacji może edytować** listę; zmiany są utrwalane przez Gateway i rozsyłane do wszystkich.
- macOS i iOS zachowują lokalne przełączniki **włączonego/wyłączonego wybudzania głosowego** (lokalny UX i uprawnienia się różnią).
- Android obecnie utrzymuje wybudzanie głosowe wyłączone i używa ręcznego przepływu mikrofonu na karcie Głos.

## Przechowywanie (host Gateway)

Słowa wybudzające i reguły routingu są przechowywane w bazie danych stanu gateway:

- `~/.openclaw/state/openclaw.sqlite`

Aktywne tabele to:

- `voicewake_triggers`
- `voicewake_routing_config`
- `voicewake_routing_routes`

Starsze pliki `settings/voicewake.json` i `settings/voicewake-routing.json` są
wyłącznie danymi wejściowymi migracji doctor; runtime odczytuje i zapisuje tabele SQLite.

## Protokół

### Metody

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` z parametrami `{ triggers: string[] }` → `{ triggers: string[] }`

Uwagi:

- Wyzwalacze są normalizowane (przycinane, puste wartości są usuwane). Puste listy wracają do wartości domyślnych.
- Limity są egzekwowane ze względów bezpieczeństwa (ograniczenia liczby/długości).

### Metody routingu (wyzwalacz → cel)

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- `voicewake.routing.set` z parametrami `{ config: VoiceWakeRoutingConfig }` → `{ config: VoiceWakeRoutingConfig }`

Kształt `VoiceWakeRoutingConfig`:

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

Cele tras obsługują dokładnie jedną z poniższych postaci:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### Zdarzenia

- Ładunek `voicewake.changed` `{ triggers: string[] }`
- Ładunek `voicewake.routing.changed` `{ config: VoiceWakeRoutingConfig }`

Kto je otrzymuje:

- Wszyscy klienci WebSocket (aplikacja macOS, WebChat itd.)
- Wszystkie połączone węzły (iOS/Android), a także przy połączeniu węzła jako początkowe wysłanie „bieżącego stanu”.

## Zachowanie klienta

### Aplikacja macOS

- Używa globalnej listy do bramkowania wyzwalaczy `VoiceWakeRuntime`.
- Edycja „Słów wyzwalających” w ustawieniach wybudzania głosowego wywołuje `voicewake.set`, a następnie polega na rozgłoszeniu, aby utrzymać synchronizację innych klientów.

### Węzeł iOS

- Używa globalnej listy do wykrywania wyzwalaczy `VoiceWakeManager`.
- Edycja słów wybudzających w ustawieniach wywołuje `voicewake.set` (przez Gateway WS) i utrzymuje lokalne wykrywanie słów wybudzających w gotowości.

### Węzeł Android

- Wybudzanie głosowe jest obecnie wyłączone w runtime/ustawieniach Androida.
- Głos w Androidzie używa ręcznego przechwytywania mikrofonu na karcie Głos zamiast wyzwalaczy słów wybudzających.

## Powiązane

- [Tryb rozmowy](/pl/nodes/talk)
- [Dźwięk i notatki głosowe](/pl/nodes/audio)
- [Rozumienie multimediów](/pl/nodes/media-understanding)
