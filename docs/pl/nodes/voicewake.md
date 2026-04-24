---
read_when:
    - Zmiana zachowania lub ustawień domyślnych słów wybudzających głosu
    - Dodawanie nowych platform Node wymagających synchronizacji słów wybudzających
summary: Globalne słowa wybudzające głosu (zarządzane przez Gateway) i sposób ich synchronizacji między Nodes
title: Wybudzanie głosem
x-i18n:
    generated_at: "2026-04-24T09:19:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5094c17aaa7f868beb81d04f7dc60565ded1852cc5c835a33de64dbd3da74bb4
    source_path: nodes/voicewake.md
    workflow: 15
---

OpenClaw traktuje **słowa wybudzające jako jedną globalną listę** zarządzaną przez **Gateway**.

- **Nie ma niestandardowych słów wybudzających per Node**.
- **Dowolny interfejs Node/aplikacji może edytować** tę listę; zmiany są utrwalane przez Gateway i rozgłaszane do wszystkich.
- macOS i iOS zachowują lokalne przełączniki **Voice Wake włączone/wyłączone** (lokalne UX + uprawnienia różnią się).
- Android obecnie utrzymuje Voice Wake wyłączone i używa ręcznego przepływu mikrofonu w karcie Voice.

## Przechowywanie (host Gateway)

Słowa wybudzające są przechowywane na maszynie gateway w:

- `~/.openclaw/settings/voicewake.json`

Kształt:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## Protokół

### Metody

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` z parametrami `{ triggers: string[] }` → `{ triggers: string[] }`

Uwagi:

- Wyzwalacze są normalizowane (przycinanie spacji, usuwanie pustych wartości). Puste listy wracają do ustawień domyślnych.
- Dla bezpieczeństwa egzekwowane są limity (liczba/długość).

### Zdarzenia

- payload `voicewake.changed` `{ triggers: string[] }`

Kto je otrzymuje:

- Wszyscy klienci WebSocket (aplikacja macOS, WebChat itd.)
- Wszystkie podłączone Nodes (iOS/Android), a także przy połączeniu Node jako początkowe wypchnięcie „bieżącego stanu”.

## Zachowanie klienta

### Aplikacja macOS

- Używa globalnej listy do bramkowania wyzwalaczy `VoiceWakeRuntime`.
- Edytowanie „Trigger words” w ustawieniach Voice Wake wywołuje `voicewake.set`, a następnie polega na rozgłoszeniu, aby utrzymać synchronizację z innymi klientami.

### Node iOS

- Używa globalnej listy do wykrywania wyzwalaczy `VoiceWakeManager`.
- Edytowanie Wake Words w Ustawieniach wywołuje `voicewake.set` (przez Gateway WS), a jednocześnie utrzymuje responsywność lokalnego wykrywania słów wybudzających.

### Node Android

- Voice Wake jest obecnie wyłączone w runtime/Ustawieniach Androida.
- Głos w Androidzie używa ręcznego przechwytywania mikrofonu w karcie Voice zamiast wyzwalaczy słów wybudzających.

## Powiązane

- [Tryb Talk](/pl/nodes/talk)
- [Audio i notatki głosowe](/pl/nodes/audio)
- [Rozumienie multimediów](/pl/nodes/media-understanding)
