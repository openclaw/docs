---
read_when:
    - Zmieniasz zachowanie lub domyślne ustawienia słów wybudzania głosowego
    - Dodajesz nowe platformy węzłów, które wymagają synchronizacji słów wybudzania
summary: Globalne słowa wybudzania głosowego (należące do Gateway) i sposób ich synchronizacji między węzłami
title: Voice Wake
x-i18n:
    generated_at: "2026-04-05T13:58:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: a80e0cf7f68a3d48ff79af0ffb3058a7a0ecebd2cdbaad20b9ff53bc2b39dc84
    source_path: nodes/voicewake.md
    workflow: 15
---

# Voice Wake (globalne słowa wybudzania)

OpenClaw traktuje **słowa wybudzania** jako **jedną globalną listę** należącą do **Gateway**.

- Nie ma **niestandardowych słów wybudzania dla poszczególnych węzłów**.
- **Dowolny interfejs węzła/aplikacji może edytować** tę listę; zmiany są utrwalane przez Gateway i rozsyłane do wszystkich.
- macOS i iOS zachowują lokalne przełączniki **Voice Wake włączone/wyłączone** (lokalny UX + uprawnienia różnią się).
- Android obecnie ma Voice Wake wyłączone i używa ręcznego przepływu mikrofonu na karcie Voice.

## Przechowywanie (host Gateway)

Słowa wybudzania są przechowywane na maszynie gateway w:

- `~/.openclaw/settings/voicewake.json`

Postać:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## Protokół

### Metody

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` z parametrami `{ triggers: string[] }` → `{ triggers: string[] }`

Uwagi:

- Triggery są normalizowane (przycinanie spacji, usuwanie pustych wartości). Puste listy wracają do wartości domyślnych.
- Ze względów bezpieczeństwa egzekwowane są limity (liczba/długość).

### Zdarzenia

- ładunek `voicewake.changed` `{ triggers: string[] }`

Kto je otrzymuje:

- Wszyscy klienci WebSocket (aplikacja macOS, WebChat itd.)
- Wszystkie podłączone węzły (iOS/Android), a także przy połączeniu węzła jako początkowe wypchnięcie „bieżącego stanu”.

## Zachowanie klienta

### Aplikacja macOS

- Używa globalnej listy do sterowania triggerami `VoiceWakeRuntime`.
- Edytowanie „Trigger words” w ustawieniach Voice Wake wywołuje `voicewake.set`, a następnie polega na rozgłoszeniu, aby utrzymać synchronizację z innymi klientami.

### Węzeł iOS

- Używa globalnej listy do wykrywania triggerów przez `VoiceWakeManager`.
- Edytowanie Wake Words w Ustawieniach wywołuje `voicewake.set` (przez Gateway WS) i jednocześnie utrzymuje responsywność lokalnego wykrywania słów wybudzania.

### Węzeł Android

- Voice Wake jest obecnie wyłączone w środowisku uruchomieniowym/Ustawieniach Androida.
- Głos na Androidzie używa ręcznego przechwytywania mikrofonu na karcie Voice zamiast triggerów słów wybudzania.
