---
read_when:
    - Implementacja trybu rozmowy na macOS/iOS/Android
    - Zmiana zachowania głosu/TTS/przerywania
summary: 'Tryb rozmowy: ciągłe konwersacje mówione z użyciem lokalnego STT/TTS i głosu w czasie rzeczywistym'
title: Tryb rozmowy
x-i18n:
    generated_at: "2026-05-06T09:20:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: a04304a1dd6c3feefa89c0c8c66f8026a7d28b573776fcf14237c3481fbc772a
    source_path: nodes/talk.md
    workflow: 16
---

Tryb Talk ma dwa kształty uruchomieniowe:

- Natywny Talk na macOS/iOS/Android używa lokalnego rozpoznawania mowy, czatu Gateway oraz TTS `talk.speak`. Instancje Node ogłaszają funkcję `talk` i deklarują obsługiwane polecenia `talk.*`.
- Talk w przeglądarce używa `talk.client.create` dla należących do klienta sesji `webrtc` i `provider-websocket` albo `talk.session.create` dla należących do Gateway sesji `gateway-relay`. `managed-room` jest zarezerwowane dla przekazania przez Gateway i pokoi walkie-talkie.
- Klienci tylko do transkrypcji używają `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, a następnie `talk.session.appendAudio`, `talk.session.cancelTurn` i `talk.session.close`, gdy potrzebują napisów lub dyktowania bez głosowej odpowiedzi asystenta.

Natywny Talk to ciągła pętla rozmowy głosowej:

1. Nasłuch mowy
2. Wysłanie transkrypcji do modelu przez aktywną sesję
3. Oczekiwanie na odpowiedź
4. Odtworzenie jej przez skonfigurowanego dostawcę Talk (`talk.speak`)

Talk w czasie rzeczywistym w przeglądarce przekazuje wywołania narzędzi dostawcy przez `talk.client.toolCall`; klienci przeglądarkowi nie wywołują `chat.send` bezpośrednio dla konsultacji w czasie rzeczywistym.

Talk tylko do transkrypcji emituje tę samą wspólną kopertę zdarzeń Talk co sesje w czasie rzeczywistym i STT/TTS, ale używa `mode: "transcription"` i `brain: "none"`. Służy do napisów, dyktowania i przechwytywania mowy tylko w trybie obserwacji; jednorazowo przesyłane notatki głosowe nadal używają ścieżki mediów/audio.

## Zachowanie (macOS)

- **Zawsze widoczna nakładka**, gdy tryb Talk jest włączony.
- Przejścia faz **Nasłuchiwanie → Myślenie → Mówienie**.
- Po **krótkiej pauzie** (okno ciszy) bieżąca transkrypcja jest wysyłana.
- Odpowiedzi są **zapisywane w WebChat** (tak samo jak wpisywanie).
- **Przerywanie mową** (domyślnie włączone): jeśli użytkownik zacznie mówić, gdy asystent mówi, zatrzymujemy odtwarzanie i zapisujemy znacznik czasu przerwania dla następnego promptu.

## Dyrektywy głosowe w odpowiedziach

Asystent może poprzedzić odpowiedź **pojedynczym wierszem JSON**, aby sterować głosem:

```json
{ "voice": "<voice-id>", "once": true }
```

Zasady:

- Tylko pierwszy niepusty wiersz.
- Nieznane klucze są ignorowane.
- `once: true` dotyczy tylko bieżącej odpowiedzi.
- Bez `once` głos staje się nową wartością domyślną dla trybu Talk.
- Wiersz JSON jest usuwany przed odtwarzaniem TTS.

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
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          apiKey: "openai_api_key",
          model: "gpt-realtime",
          voice: "alloy",
        },
      },
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

Wartości domyślne:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: gdy nie jest ustawione, Talk zachowuje domyślne okno pauzy platformy przed wysłaniem transkrypcji (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: wybiera aktywnego dostawcę Talk. Użyj `elevenlabs`, `mlx` albo `system` dla ścieżek odtwarzania lokalnych dla macOS.
- `providers.<provider>.voiceId`: korzysta awaryjnie z `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` dla ElevenLabs (albo z pierwszego głosu ElevenLabs, gdy klucz API jest dostępny).
- `providers.elevenlabs.modelId`: domyślnie `eleven_v3`, gdy nie jest ustawione.
- `providers.mlx.modelId`: domyślnie `mlx-community/Soprano-80M-bf16`, gdy nie jest ustawione.
- `providers.elevenlabs.apiKey`: korzysta awaryjnie z `ELEVENLABS_API_KEY` (albo z profilu powłoki Gateway, jeśli jest dostępny).
- `realtime.provider`: wybiera aktywnego dostawcę głosu w czasie rzeczywistym dla przeglądarki/serwera. Użyj `openai` dla WebRTC, `google` dla WebSocket dostawcy albo dostawcy tylko-mostkowego przez przekaźnik Gateway.
- `realtime.providers.<provider>` przechowuje należącą do dostawcy konfigurację czasu rzeczywistego. Przeglądarka otrzymuje tylko tymczasowe lub ograniczone dane uwierzytelniające sesji, nigdy standardowy klucz API.
- `realtime.brain`: `agent-consult` kieruje wywołania narzędzi czasu rzeczywistego przez politykę Gateway; `direct-tools` to zachowanie zgodności tylko dla właściciela; `none` jest przeznaczone do transkrypcji lub zewnętrznej orkiestracji.
- `talk.catalog` udostępnia prawidłowe tryby, transporty, strategie brain, formaty audio czasu rzeczywistego i flagi funkcji każdego dostawcy, aby własne klienty Talk mogły unikać nieobsługiwanych kombinacji.
- Dostawcy transkrypcji strumieniowej są wykrywani przez `talk.catalog.transcription`. Bieżący przekaźnik Gateway używa konfiguracji dostawcy strumieniowego Voice Call, dopóki nie zostanie dodana dedykowana powierzchnia konfiguracji transkrypcji Talk.
- `speechLocale`: opcjonalny identyfikator locale BCP 47 dla rozpoznawania mowy Talk na urządzeniu na iOS/macOS. Pozostaw nieustawione, aby użyć domyślnego ustawienia urządzenia.
- `outputFormat`: domyślnie `pcm_44100` na macOS/iOS i `pcm_24000` na Androidzie (ustaw `mp3_*`, aby wymusić strumieniowanie MP3)

## Interfejs macOS

- Przełącznik na pasku menu: **Talk**
- Karta konfiguracji: grupa **Talk Mode** (identyfikator głosu + przełącznik przerywania)
- Nakładka:
  - **Nasłuchiwanie**: chmura pulsuje z poziomem mikrofonu
  - **Myślenie**: animacja zapadania
  - **Mówienie**: rozchodzące się pierścienie
  - Kliknięcie chmury: zatrzymanie mówienia
  - Kliknięcie X: wyjście z trybu Talk

## Interfejs Android

- Przełącznik na karcie głosu: **Talk**
- Ręczne tryby **Mic** i **Talk** są wzajemnie wykluczającymi się trybami przechwytywania w czasie działania.
- Ręczny Mic zatrzymuje się, gdy aplikacja opuszcza pierwszy plan albo użytkownik opuszcza kartę głosu.
- Talk Mode działa, dopóki nie zostanie wyłączony lub Node Androida się nie rozłączy, i podczas aktywności używa typu usługi pierwszoplanowej mikrofonu Androida.

## Uwagi

- Wymaga uprawnień do mowy i mikrofonu.
- Natywny Talk używa aktywnej sesji Gateway i korzysta awaryjnie z odpytywania historii tylko wtedy, gdy zdarzenia odpowiedzi są niedostępne.
- Talk w czasie rzeczywistym w przeglądarce używa `talk.client.toolCall` dla `openclaw_agent_consult` zamiast ujawniać `chat.send` sesjom przeglądarkowym należącym do dostawcy.
- Talk tylko do transkrypcji używa `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` i `talk.session.close`; klienci subskrybują `talk.event`, aby otrzymywać częściowe/końcowe aktualizacje transkrypcji.
- Gateway rozwiązuje odtwarzanie Talk przez `talk.speak` przy użyciu aktywnego dostawcy Talk. Android korzysta awaryjnie z lokalnego systemowego TTS tylko wtedy, gdy to RPC jest niedostępne.
- Lokalne odtwarzanie MLX na macOS używa dołączonego pomocnika `openclaw-mlx-tts`, gdy jest obecny, albo pliku wykonywalnego w `PATH`. Ustaw `OPENCLAW_MLX_TTS_BIN`, aby wskazać niestandardowy binarny plik pomocniczy podczas programowania.
- `stability` dla `eleven_v3` jest walidowane do `0.0`, `0.5` albo `1.0`; inne modele akceptują `0..1`.
- `latency_tier` jest walidowane do `0..4`, gdy jest ustawione.
- Android obsługuje formaty wyjściowe `pcm_16000`, `pcm_22050`, `pcm_24000` i `pcm_44100` dla strumieniowania AudioTrack o niskim opóźnieniu.

## Powiązane

- [Wybudzanie głosem](/pl/nodes/voicewake)
- [Audio i notatki głosowe](/pl/nodes/audio)
- [Rozumienie mediów](/pl/nodes/media-understanding)
