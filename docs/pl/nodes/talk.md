---
read_when:
    - Implementowanie trybu Talk na macOS/iOS/Android
    - Zmiana zachowania voice/TTS/interrupt ചെയ്തു to=functions.read in commentary արզjson  玩大发快三path":"docs/concepts/talk.md"}
summary: 'Tryb Talk: ciągłe rozmowy głosowe z ElevenLabs TTS'
title: Tryb Talk
x-i18n:
    generated_at: "2026-04-24T09:19:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 49286cd39a104d4514eb1df75627a2f64182313b11792bb246f471178a702198
    source_path: nodes/talk.md
    workflow: 15
---

Tryb Talk to ciągła pętla rozmowy głosowej:

1. Nasłuchuj mowy
2. Wyślij transkrypt do modelu (główna sesja, `chat.send`)
3. Poczekaj na odpowiedź
4. Odtwórz ją przez skonfigurowanego providera Talk (`talk.speak`)

## Zachowanie (macOS)

- **Zawsze aktywna nakładka**, gdy tryb Talk jest włączony.
- Przejścia faz **Listening → Thinking → Speaking**.
- Przy **krótkiej pauzie** (okno ciszy) bieżący transkrypt jest wysyłany.
- Odpowiedzi są **zapisywane do WebChat** (tak samo jak przy pisaniu).
- **Interrupt on speech** (domyślnie włączone): jeśli użytkownik zacznie mówić, gdy asystent mówi, zatrzymujemy odtwarzanie i zapisujemy znacznik czasu przerwania do następnego promptu.

## Dyrektywy głosowe w odpowiedziach

Asystent może poprzedzić odpowiedź **jednym wierszem JSON**, aby sterować głosem:

```json
{ "voice": "<voice-id>", "once": true }
```

Reguły:

- Tylko pierwszy niepusty wiersz.
- Nieznane klucze są ignorowane.
- `once: true` dotyczy tylko bieżącej odpowiedzi.
- Bez `once` głos staje się nowym domyślnym głosem dla trybu Talk.
- Wiersz JSON jest usuwany przed odtworzeniem TTS.

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

Wartości domyślne:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: jeśli nieustawione, Talk zachowuje domyślne okno pauzy platformy przed wysłaniem transkryptu (`700 ms na macOS i Android, 900 ms na iOS`)
- `voiceId`: fallback do `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` (albo pierwszego głosu ElevenLabs, gdy klucz API jest dostępny)
- `modelId`: domyślnie `eleven_v3`, jeśli nieustawione
- `apiKey`: fallback do `ELEVENLABS_API_KEY` (albo profilu powłoki gateway, jeśli dostępny)
- `outputFormat`: domyślnie `pcm_44100` na macOS/iOS i `pcm_24000` na Android (ustaw `mp3_*`, aby wymusić strumieniowanie MP3)

## Interfejs macOS

- Przełącznik na pasku menu: **Talk**
- Karta konfiguracji: grupa **Talk Mode** (voice id + przełącznik interrupt)
- Nakładka:
  - **Listening**: chmura pulsuje zgodnie z poziomem mikrofonu
  - **Thinking**: animacja opadania
  - **Speaking**: promieniujące kręgi
  - Kliknięcie chmury: zatrzymaj mówienie
  - Kliknięcie X: wyjdź z trybu Talk

## Uwagi

- Wymaga uprawnień Speech + Microphone.
- Używa `chat.send` względem klucza sesji `main`.
- Gateway rozwiązuje odtwarzanie Talk przez `talk.speak`, używając aktywnego providera Talk. Android wraca do lokalnego systemowego TTS tylko wtedy, gdy to RPC jest niedostępne.
- `stability` dla `eleven_v3` jest walidowane do `0.0`, `0.5` albo `1.0`; inne modele akceptują `0..1`.
- `latency_tier` jest walidowane do `0..4`, gdy jest ustawione.
- Android obsługuje formaty wyjściowe `pcm_16000`, `pcm_22050`, `pcm_24000` i `pcm_44100` dla niskolatencyjnego strumieniowania AudioTrack.

## Powiązane

- [Voice wake](/pl/nodes/voicewake)
- [Audio i notatki głosowe](/pl/nodes/audio)
- [Rozumienie multimediów](/pl/nodes/media-understanding)
