---
read_when:
    - Implementowanie trybu rozmowy w systemach macOS/iOS/Android
    - Zmiana zachowania głosu/TTS/przerywania
summary: 'Tryb rozmowy: ciągłe konwersacje głosowe z wykorzystaniem lokalnych funkcji STT/TTS i głosu w czasie rzeczywistym'
title: Tryb rozmowy
x-i18n:
    generated_at: "2026-07-12T15:16:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4180dcbf7a62cd03e2d18f2c568ed2182c9cf2f80159154a7d261bcb9b3ebee0
    source_path: nodes/talk.md
    workflow: 16
---

Tryb rozmowy obejmuje pięć wariantów działania:

- **Natywna rozmowa w macOS/iOS/Androidzie**: lokalne rozpoznawanie mowy, czat przez Gateway oraz synteza mowy TTS za pomocą `talk.speak`. Węzły ogłaszają funkcję `talk` i deklarują, które polecenia `talk.*` obsługują.
- **Rozmowa w iOS (w czasie rzeczywistym)**: WebRTC zarządzane przez klienta dla konfiguracji OpenAI czasu rzeczywistego, które wybierają transport `webrtc` lub go pomijają. Jawne konfiguracje czasu rzeczywistego `gateway-relay`, `provider-websocket` oraz konfiguracje dostawców innych niż OpenAI pozostają na przekaźniku zarządzanym przez Gateway; konfiguracje niedziałające w czasie rzeczywistym używają natywnej pętli obsługi mowy.
- **Rozmowa w przeglądarce**: `talk.client.create` dla zarządzanych przez klienta sesji `webrtc`/`provider-websocket` albo `talk.session.create` dla zarządzanych przez Gateway sesji `gateway-relay`. Wartość `managed-room` jest zarezerwowana dla przekazywania obsługi przez Gateway i pokojów typu krótkofalówka.
- **Rozmowa w Androidzie (w czasie rzeczywistym)**: włącz ją za pomocą `talk.realtime.mode: "realtime"` i `talk.realtime.transport: "gateway-relay"`. W przeciwnym razie Android nadal korzysta z natywnego rozpoznawania mowy, czatu przez Gateway oraz `talk.speak`.
- **Klienci obsługujący wyłącznie transkrypcję**: `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, a następnie `talk.session.appendAudio`, `talk.session.cancelTurn` i `talk.session.close` do napisów lub dyktowania bez głosowej odpowiedzi asystenta. Jednorazowo przesyłane notatki głosowe nadal korzystają ze ścieżki dźwiękowej [rozumienia multimediów](/pl/nodes/media-understanding).

Natywna rozmowa działa jako ciągła pętla: nasłuchuje mowy, wysyła transkrypcję do modelu przez aktywną sesję, czeka na odpowiedź, a następnie odtwarza ją głosowo za pomocą skonfigurowanego dostawcy rozmowy (`talk.speak`).

Rozmowa w czasie rzeczywistym zarządzana przez klienta przekazuje wywołania narzędzi dostawcy przez `talk.client.toolCall`, zamiast bezpośrednio wywoływać `chat.send`. Gdy aktywna jest konsultacja w czasie rzeczywistym, klienci mogą wywołać `talk.client.steer` lub `talk.session.steer`, aby sklasyfikować wypowiedź jako `status`, `steer`, `cancel` albo `followup`. Zaakceptowane sterowanie zostaje dodane do kolejki aktywnego osadzonego przebiegu; odrzucone sterowanie zwraca przyczynę, taką jak `no_active_run`, `not_streaming` lub `compacting`.

Rozmowa obsługująca wyłącznie transkrypcję emituje tę samą otoczkę zdarzeń rozmowy co sesje czasu rzeczywistego oraz STT/TTS, ale używa `mode: "transcription"` i `brain: "none"`. Wszystkie sesje rozmowy rozgłaszają zdarzenia w kanale `talk.event`; klienci subskrybują go, aby otrzymywać częściowe i końcowe aktualizacje transkrypcji (`transcript.delta`/`transcript.done`) oraz inne dane telemetryczne sesji.

## Zachowanie (macOS)

- Nakładka jest stale widoczna, gdy tryb rozmowy jest włączony.
- Przejścia między fazami **Słuchanie &rarr; Myślenie &rarr; Mówienie**.
- Po krótkiej przerwie (oknie ciszy) bieżąca transkrypcja zostaje wysłana.
- Odpowiedzi są zapisywane w WebChat (tak samo jak podczas pisania).
- **Przerywanie mową** (domyślnie włączone): jeśli użytkownik zacznie mówić, gdy asystent odtwarza wypowiedź, odtwarzanie zostaje zatrzymane, a znacznik czasu przerwania jest zapisywany na potrzeby następnego polecenia.

## Dyrektywy głosowe w odpowiedziach

Asystent może poprzedzić odpowiedź pojedynczym wierszem JSON sterującym głosem:

```json
{ "voice": "<voice-id>", "once": true }
```

Reguły:

- Wyłącznie pierwszy niepusty wiersz; wiersz JSON jest usuwany przed odtworzeniem TTS.
- Nieznane klucze są ignorowane.
- `once: true` ma zastosowanie tylko do bieżącej odpowiedzi; bez tej opcji głos staje się nowym domyślnym głosem trybu rozmowy.

Obsługiwane klucze: `voice` / `voice_id` / `voiceId`, `model` / `model_id` / `modelId`, `speed`, `rate` (słów na minutę), `stability`, `similarity`, `style`, `speakerBoost`, `seed`, `normalize`, `lang`, `output_format`, `latency_tier`, `once`.

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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
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

| Klucz                                    | Wartość domyślna                           | Uwagi                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`                               | -                                          | Aktywny dostawca TTS trybu rozmowy. Użyj `elevenlabs`, `mlx` lub `system` dla lokalnych ścieżek odtwarzania w macOS.                                                                                                                                                                                                                          |
| `providers.<id>.voiceId`                 | -                                          | ElevenLabs używa awaryjnie `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` albo pierwszego dostępnego głosu, jeśli podano klucz API.                                                                                                                                                                                                                  |
| `providers.elevenlabs.modelId`           | `eleven_v3`                                |                                                                                                                                                                                                                                                                                                                                             |
| `providers.mlx.modelId`                  | `mlx-community/Soprano-80M-bf16`           |                                                                                                                                                                                                                                                                                                                                             |
| `providers.elevenlabs.apiKey`            | -                                          | Używa awaryjnie `ELEVENLABS_API_KEY` (lub profilu powłoki Gateway, jeśli jest dostępny).                                                                                                                                                                                                                                                     |
| `speechLocale`                           | ustawienie domyślne urządzenia              | Identyfikator ustawień regionalnych BCP 47 używany przez lokalne rozpoznawanie mowy trybu rozmowy w iOS/macOS.                                                                                                                                                                                                                               |
| `silenceTimeoutMs`                       | `700` ms w macOS/Androidzie, `900` ms w iOS | Okno przerwy, po którym tryb rozmowy wysyła transkrypcję.                                                                                                                                                                                                                                                                                   |
| `interruptOnSpeech`                      | `true`                                     |                                                                                                                                                                                                                                                                                                                                             |
| `outputFormat`                           | `pcm_44100` w macOS/iOS, `pcm_24000` w Androidzie | Ustaw `mp3_*`, aby wymusić strumieniowanie MP3.                                                                                                                                                                                                                                                                                      |
| `consultThinkingLevel`                   | nieustawione                                | Nadpisanie poziomu myślenia dla przebiegu agenta obsługującego wywołania `openclaw_agent_consult` w czasie rzeczywistym.                                                                                                                                                                                                                     |
| `consultFastMode`                        | nieustawione                                | Nadpisanie trybu szybkiego dla wywołań `openclaw_agent_consult` w czasie rzeczywistym.                                                                                                                                                                                                                                                      |
| `realtime.provider`                      | -                                          | `openai` dla WebRTC, `google` dla WebSocket dostawcy albo dostawca obsługujący wyłącznie most przez przekaźnik Gateway.                                                                                                                                                                                                                      |
| `realtime.providers.<id>`                | -                                          | Konfiguracja czasu rzeczywistego zarządzana przez dostawcę. Przeglądarki otrzymują wyłącznie tymczasowe lub ograniczone dane uwierzytelniające sesji, nigdy standardowy klucz API.                                                                                                                                                            |
| `realtime.providers.openai.speakerVoice` | `alloy`                                    | Identyfikator wbudowanego głosu OpenAI Realtime (starszy klucz `voice` nadal działa, ale jest przestarzały). Obecne głosy `gpt-realtime-2.1`: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `marin`, `sage`, `shimmer`, `verse`; dla najlepszej jakości zalecane są `marin` i `cedar`. |
| `realtime.transport`                     | -                                          | `webrtc`: WebRTC OpenAI zarządzane przez klienta w iOS i przeglądarce. `provider-websocket`: zarządzane przez przeglądarkę, w iOS pozostaje na przekaźniku Gateway. `gateway-relay`: utrzymuje dźwięk dostawcy w Gateway; Android używa trybu czasu rzeczywistego tylko z tym transportem. |
| `realtime.brain`                         | -                                          | `agent-consult` kieruje wywołania narzędzi czasu rzeczywistego przez zasady Gateway; `direct-tools` zapewnia zgodność ze starszym bezpośrednim użyciem narzędzi; `none` służy do transkrypcji lub zewnętrznej orkiestracji.                                                                                                                        |
| `realtime.consultRouting`                | -                                          | `provider-direct` zachowuje bezpośrednią odpowiedź dostawcy, gdy pomija on `openclaw_agent_consult`; `force-agent-consult` zamiast tego kieruje ukończone transkrypcje użytkownika przez OpenClaw.                                                                                                                                             |
| `realtime.instructions`                  | -                                          | Dołącza skierowane do dostawcy instrukcje systemowe do wbudowanego polecenia czasu rzeczywistego OpenClaw (styl i ton głosu); domyślne wskazówki `openclaw_agent_consult` pozostają bez zmian.                                                                                                                                                   |

`talk.catalog` udostępnia kanoniczne identyfikatory dostawców i aliasy rejestru, prawidłowe tryby, transporty, strategie mózgu, formaty dźwięku w czasie rzeczywistym i flagi możliwości każdego dostawcy oraz wybrany w czasie działania wynik gotowości. Klienci Talk dostarczani przez OpenClaw powinni odczytywać ten katalog zamiast lokalnie utrzymywać aliasy dostawców; starszy Gateway, który pomija gotowość grupową, należy traktować jako niezweryfikowany, a nie jednoznacznie nieskonfigurowany. Dostawcy strumieniowej transkrypcji są wykrywani za pośrednictwem `talk.catalog.transcription`; bieżący przekaźnik Gateway korzysta z konfiguracji dostawcy strumieniowego Voice Call, dopóki nie zostanie udostępniona dedykowana konfiguracja transkrypcji Talk.

## Interfejs macOS

- Przełącznik na pasku menu: **Talk**
- Karta konfiguracji: grupa **Talk Mode** (identyfikator głosu i przełącznik przerywania)
- Nakładka: kula wyświetla uniwersalny przebieg fali rozmowy (współdzielony z systemami iOS, watchOS i Android). W trybie słuchania reaguje na bieżący poziom mikrofonu, w trybie mówienia odzwierciedla rzeczywistą obwiednię odtwarzania TTS, a w trybie myślenia delikatnie pulsuje. Kliknij kulę, aby wstrzymać lub wznowić, kliknij ją dwukrotnie, aby zatrzymać mówienie, albo kliknij X, aby wyjść z trybu Talk.

## Interfejs Androida

- Przełącznik na karcie głosu: **Talk**
- Ręczne tryby **Mic** i **Talk** wzajemnie się wykluczają.
- Ręczny tryb Mic i Talk w czasie rzeczywistym preferują mikrofon podłączonego zestawu słuchawkowego Bluetooth Classic lub BLE; jeśli połączenie zostanie przerwane, aplikacja zażąda innego wejścia zestawu słuchawkowego albo użyje domyślnego mikrofonu, a po zakończeniu przechwytywania przywróci domyślne ustawienie.
- Ręczny tryb Mic zatrzymuje się, gdy aplikacja przestaje działać na pierwszym planie lub użytkownik opuszcza kartę głosu.
- Tryb Talk działa do chwili jego wyłączenia lub rozłączenia Node i podczas aktywności korzysta z androidowego typu usługi pierwszoplanowej dla mikrofonu.
- Android obsługuje formaty wyjściowe `pcm_16000`, `pcm_22050`, `pcm_24000` i `pcm_44100` na potrzeby strumieniowania `AudioTrack` o małym opóźnieniu.

## Uwagi

- Wymaga uprawnień do rozpoznawania mowy i mikrofonu.
- Natywny tryb Talk korzysta z aktywnej sesji Gateway i przechodzi na odpytywanie historii tylko wtedy, gdy zdarzenia odpowiedzi są niedostępne.
- Gateway realizuje odtwarzanie Talk za pośrednictwem `talk.speak`, używając aktywnego dostawcy Talk. Android przechodzi na lokalny systemowy TTS tylko wtedy, gdy to wywołanie RPC jest niedostępne.
- Lokalne odtwarzanie MLX w systemie macOS korzysta z dołączonego narzędzia pomocniczego `openclaw-mlx-tts`, jeśli jest dostępne, albo z pliku wykonywalnego znajdującego się w `PATH`. Podczas programowania ustaw `OPENCLAW_MLX_TTS_BIN`, aby wskazywała niestandardowy plik wykonywalny narzędzia pomocniczego.
- Zakresy wartości dyrektyw głosowych (ElevenLabs): `stability`, `similarity` i `style` przyjmują `0..1`; `speed` przyjmuje `0.5..2`; `latency_tier` przyjmuje `0..4`.

## Powiązane

- [Aktywacja głosowa](/pl/nodes/voicewake)
- [Dźwięk i notatki głosowe](/pl/nodes/audio)
- [Rozumienie multimediów](/pl/nodes/media-understanding)
