---
read_when:
    - Implementujesz tryb rozmowy na macOS/iOS/Android
    - Zmieniasz zachowanie głosu/TTS/przerywania
summary: 'Tryb rozmowy: ciągłe rozmowy głosowe z TTS ElevenLabs'
title: Tryb rozmowy
x-i18n:
    generated_at: "2026-04-05T13:59:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f10a3e9ee8fc2b4f7a89771d6e7b7373166a51ef9e9aa2d8c5ea67fc0729f9d
    source_path: nodes/talk.md
    workflow: 15
---

# Tryb rozmowy

Tryb rozmowy to ciągła pętla rozmowy głosowej:

1. Nasłuchuj mowy
2. Wyślij transkrypt do modelu (sesja główna, `chat.send`)
3. Poczekaj na odpowiedź
4. Odtwórz ją przez skonfigurowanego dostawcę trybu rozmowy (`talk.speak`)

## Zachowanie (macOS)

- **Zawsze aktywna nakładka** podczas włączonego trybu rozmowy.
- Przejścia faz **Listening → Thinking → Speaking**.
- Przy **krótkiej pauzie** (okno ciszy) bieżący transkrypt jest wysyłany.
- Odpowiedzi są **zapisywane do WebChat** (tak samo jak przy wpisywaniu).
- **Przerwanie przez mowę** (domyślnie włączone): jeśli użytkownik zacznie mówić, gdy asystent mówi, zatrzymujemy odtwarzanie i zapisujemy znacznik czasu przerwania do następnego promptu.

## Dyrektywy głosowe w odpowiedziach

Asystent może poprzedzić odpowiedź **pojedynczą linią JSON**, aby sterować głosem:

```json
{ "voice": "<voice-id>", "once": true }
```

Zasady:

- Tylko pierwsza niepusta linia.
- Nieznane klucze są ignorowane.
- `once: true` dotyczy tylko bieżącej odpowiedzi.
- Bez `once` głos staje się nowym domyślnym głosem trybu rozmowy.
- Linia JSON jest usuwana przed odtworzeniem TTS.

Obsługiwane klucze:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Konfiguracja (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

Ustawienia domyślne:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: gdy nie jest ustawione, tryb rozmowy zachowuje domyślne dla platformy okno pauzy przed wysłaniem transkryptu (`700 ms` na macOS i Android, `900 ms` na iOS)
- `voiceId`: wraca do `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` (albo do pierwszego głosu ElevenLabs, gdy dostępny jest klucz API)
- `modelId`: domyślnie `eleven_v3`, gdy nie jest ustawione
- `apiKey`: wraca do `ELEVENLABS_API_KEY` (albo do profilu powłoki gateway, jeśli jest dostępny)
- `outputFormat`: domyślnie `pcm_44100` na macOS/iOS oraz `pcm_24000` na Androidzie (ustaw `mp3_*`, aby wymusić strumieniowanie MP3)

## UI macOS

- Przełącznik w pasku menu: **Talk**
- Karta konfiguracji: grupa **Talk Mode** (voice id + przełącznik przerwania)
- Nakładka:
  - **Listening**: pulsująca chmura z poziomem mikrofonu
  - **Thinking**: opadająca animacja
  - **Speaking**: promieniujące kręgi
  - Kliknięcie chmury: zatrzymuje mówienie
  - Kliknięcie X: wychodzi z trybu rozmowy

## Uwagi

- Wymaga uprawnień do mowy i mikrofonu.
- Używa `chat.send` względem klucza sesji `main`.
- Gateway rozwiązuje odtwarzanie trybu rozmowy przez `talk.speak` z użyciem aktywnego dostawcy trybu rozmowy. Android przechodzi awaryjnie na lokalny systemowy TTS tylko wtedy, gdy ten RPC jest niedostępny.
- `stability` dla `eleven_v3` jest walidowane do `0.0`, `0.5` lub `1.0`; inne modele akceptują `0..1`.
- `latency_tier` jest walidowane do `0..4`, gdy jest ustawione.
- Android obsługuje formaty wyjściowe `pcm_16000`, `pcm_22050`, `pcm_24000` i `pcm_44100` dla niskolatencyjnego strumieniowania AudioTrack.
