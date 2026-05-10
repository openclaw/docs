---
read_when:
    - Implementowanie trybu rozmowy na macOS/iOS/Android
    - Zmiana zachowania głosu/TTS/przerywania
summary: 'Tryb rozmowy: ciągłe rozmowy głosowe przez lokalne STT/TTS i głos w czasie rzeczywistym'
title: Tryb rozmowy
x-i18n:
    generated_at: "2026-05-10T19:42:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 28e5feae8af8ff89472dfb73c44c590b2f7fab3c0ca335b67603c7fd9d50dfe7
    source_path: nodes/talk.md
    workflow: 16
---

Tryb Talk ma dwa kształty środowiska uruchomieniowego:

- Natywny Talk w macOS/iOS/Android używa lokalnego rozpoznawania mowy, czatu Gateway oraz TTS `talk.speak`. Węzły ogłaszają funkcję `talk` i deklarują obsługiwane polecenia `talk.*`.
- Talk w przeglądarce używa `talk.client.create` dla sesji `webrtc` i `provider-websocket` należących do klienta albo `talk.session.create` dla sesji `gateway-relay` należących do Gateway. `managed-room` jest zarezerwowane dla przekazania przez Gateway i pokojów typu walkie-talkie.
- Klienci wyłącznie do transkrypcji używają `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, a następnie `talk.session.appendAudio`, `talk.session.cancelTurn` i `talk.session.close`, gdy potrzebują napisów lub dyktowania bez głosowej odpowiedzi asystenta.

Natywny Talk to ciągła pętla rozmowy głosowej:

1. Nasłuchuj mowy
2. Wyślij transkrypt do modelu przez aktywną sesję
3. Poczekaj na odpowiedź
4. Odtwórz ją przez skonfigurowanego dostawcę Talk (`talk.speak`)

Talk w czasie rzeczywistym w przeglądarce przekazuje wywołania narzędzi dostawcy przez `talk.client.toolCall`; klienci przeglądarkowi nie wywołują `chat.send` bezpośrednio dla konsultacji w czasie rzeczywistym.

Talk wyłącznie do transkrypcji emituje tę samą wspólną kopertę zdarzeń Talk co sesje czasu rzeczywistego oraz STT/TTS, ale używa `mode: "transcription"` i `brain: "none"`. Służy do napisów, dyktowania i przechwytywania mowy wyłącznie w trybie obserwacji; jednorazowo przesyłane notatki głosowe nadal używają ścieżki media/audio.

## Zachowanie (macOS)

- **Nakładka zawsze włączona**, gdy tryb Talk jest aktywny.
- Przejścia faz **Słuchanie → Myślenie → Mówienie**.
- Po **krótkiej pauzie** (oknie ciszy) bieżący transkrypt jest wysyłany.
- Odpowiedzi są **zapisywane w WebChat** (tak samo jak pisanie).
- **Przerwanie mową** (domyślnie włączone): jeśli użytkownik zacznie mówić, gdy asystent mówi, zatrzymujemy odtwarzanie i zapisujemy znacznik czasu przerwania dla następnego promptu.

## Dyrektywy głosowe w odpowiedziach

Asystent może poprzedzić odpowiedź **pojedynczym wierszem JSON**, aby sterować głosem:

```json
{ "voice": "<voice-id>", "once": true }
```

Reguły:

- Tylko pierwszy niepusty wiersz.
- Nieznane klucze są ignorowane.
- `once: true` dotyczy tylko bieżącej odpowiedzi.
- Bez `once` głos staje się nową domyślną wartością dla trybu Talk.
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
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

Wartości domyślne:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: gdy nie jest ustawione, Talk zachowuje domyślne okno pauzy platformy przed wysłaniem transkryptu (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: wybiera aktywnego dostawcę Talk. Użyj `elevenlabs`, `mlx` albo `system` dla lokalnych ścieżek odtwarzania w macOS.
- `providers.<provider>.voiceId`: przechodzi awaryjnie na `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` dla ElevenLabs (albo pierwszy głos ElevenLabs, gdy klucz API jest dostępny).
- `providers.elevenlabs.modelId`: domyślnie `eleven_v3`, gdy nie jest ustawione.
- `providers.mlx.modelId`: domyślnie `mlx-community/Soprano-80M-bf16`, gdy nie jest ustawione.
- `providers.elevenlabs.apiKey`: przechodzi awaryjnie na `ELEVENLABS_API_KEY` (albo profil powłoki gateway, jeśli jest dostępny).
- `consultThinkingLevel`: opcjonalne nadpisanie poziomu myślenia dla pełnego uruchomienia agenta OpenClaw za wywołaniami `openclaw_agent_consult` w czasie rzeczywistym.
- `consultFastMode`: opcjonalne nadpisanie trybu szybkiego dla wywołań `openclaw_agent_consult` w czasie rzeczywistym.
- `realtime.provider`: wybiera aktywnego dostawcę głosu czasu rzeczywistego po stronie przeglądarki/serwera. Użyj `openai` dla WebRTC, `google` dla WebSocket dostawcy albo dostawcy tylko-mostkowego przez przekaźnik Gateway.
- `realtime.providers.<provider>` przechowuje konfigurację czasu rzeczywistego należącą do dostawcy. Przeglądarka otrzymuje tylko efemeryczne lub ograniczone poświadczenia sesji, nigdy standardowy klucz API.
- `realtime.providers.openai.voice`: wbudowany identyfikator głosu OpenAI Realtime. Obecne głosy `gpt-realtime-2` to `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` i `cedar`; `marin` i `cedar` są zalecane dla najlepszej jakości.
- `realtime.brain`: `agent-consult` kieruje wywołania narzędzi czasu rzeczywistego przez politykę Gateway; `direct-tools` to zachowanie zgodności tylko dla właściciela; `none` służy do transkrypcji lub zewnętrznej orkiestracji.
- `realtime.instructions`: dołącza instrukcje systemowe widoczne dla dostawcy do wbudowanego promptu czasu rzeczywistego OpenClaw. Użyj tego dla stylu i tonu głosu; OpenClaw zachowuje domyślne wskazówki `openclaw_agent_consult`.
- `talk.catalog` udostępnia prawidłowe tryby, transporty, strategie brain, formaty audio czasu rzeczywistego i flagi funkcji każdego dostawcy, aby klienci Talk pierwszej strony mogli unikać nieobsługiwanych kombinacji.
- Dostawcy transkrypcji strumieniowej są wykrywani przez `talk.catalog.transcription`. Bieżący przekaźnik Gateway używa konfiguracji dostawcy strumieniowego Voice Call do czasu dodania dedykowanej powierzchni konfiguracji transkrypcji Talk.
- `speechLocale`: opcjonalny identyfikator locale BCP 47 dla rozpoznawania mowy Talk na urządzeniu w iOS/macOS. Pozostaw nieustawione, aby użyć domyślnego ustawienia urządzenia.
- `outputFormat`: domyślnie `pcm_44100` w macOS/iOS i `pcm_24000` w Androidzie (ustaw `mp3_*`, aby wymusić strumieniowanie MP3)

## Interfejs macOS

- Przełącznik na pasku menu: **Talk**
- Karta konfiguracji: grupa **Tryb Talk** (identyfikator głosu + przełącznik przerwania)
- Nakładka:
  - **Słuchanie**: chmura pulsuje zgodnie z poziomem mikrofonu
  - **Myślenie**: animacja opadania
  - **Mówienie**: rozchodzące się pierścienie
  - Kliknięcie chmury: zatrzymaj mówienie
  - Kliknięcie X: wyjdź z trybu Talk

## Interfejs Android

- Przełącznik karty Voice: **Talk**
- Ręczne tryby **Mic** i **Talk** wzajemnie wykluczają się jako tryby przechwytywania w środowisku uruchomieniowym.
- Ręczny Mic zatrzymuje się, gdy aplikacja opuszcza pierwszy plan albo użytkownik opuszcza kartę Voice.
- Tryb Talk działa, dopóki nie zostanie wyłączony albo węzeł Android się nie rozłączy, i podczas aktywności używa typu usługi pierwszoplanowej mikrofonu Androida.

## Uwagi

- Wymaga uprawnień do mowy i mikrofonu.
- Natywny Talk używa aktywnej sesji Gateway i przechodzi awaryjnie na odpytywanie historii tylko wtedy, gdy zdarzenia odpowiedzi są niedostępne.
- Talk w czasie rzeczywistym w przeglądarce używa `talk.client.toolCall` dla `openclaw_agent_consult` zamiast ujawniać `chat.send` sesjom przeglądarkowym należącym do dostawcy.
- Talk wyłącznie do transkrypcji używa `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` i `talk.session.close`; klienci subskrybują `talk.event`, aby otrzymywać częściowe/końcowe aktualizacje transkryptu.
- Gateway rozwiązuje odtwarzanie Talk przez `talk.speak` z użyciem aktywnego dostawcy Talk. Android przechodzi awaryjnie na lokalny systemowy TTS tylko wtedy, gdy ten RPC jest niedostępny.
- Lokalne odtwarzanie MLX w macOS używa dołączonego pomocnika `openclaw-mlx-tts`, gdy jest obecny, albo pliku wykonywalnego w `PATH`. Ustaw `OPENCLAW_MLX_TTS_BIN`, aby wskazać niestandardowy plik binarny pomocnika podczas programowania.
- `stability` dla `eleven_v3` jest walidowane do `0.0`, `0.5` albo `1.0`; inne modele akceptują `0..1`.
- `latency_tier` jest walidowane do `0..4`, gdy jest ustawione.
- Android obsługuje formaty wyjściowe `pcm_16000`, `pcm_22050`, `pcm_24000` i `pcm_44100` dla strumieniowania AudioTrack o niskim opóźnieniu.

## Powiązane

- [Wybudzanie głosem](/pl/nodes/voicewake)
- [Audio i notatki głosowe](/pl/nodes/audio)
- [Rozumienie multimediów](/pl/nodes/media-understanding)
