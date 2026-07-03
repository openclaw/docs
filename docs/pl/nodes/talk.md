---
read_when:
    - Implementowanie trybu rozmowy w systemach macOS/iOS/Android
    - Zmiana zachowania głosu/TTS/przerywania
summary: 'Tryb rozmowy: ciągłe konwersacje głosowe przez lokalne STT/TTS i głos w czasie rzeczywistym'
title: Tryb rozmowy
x-i18n:
    generated_at: "2026-07-03T01:05:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 22e1539de48fea2b1d4f04c2a6935b011c55a9a6d700b6caadc4daf5b038b60d
    source_path: nodes/talk.md
    workflow: 16
---

Tryb Talk ma dwie postacie uruchomieniowe:

- Natywny Talk w macOS/iOS/Android używa lokalnego rozpoznawania mowy, czatu Gateway i TTS `talk.speak`. Węzły ogłaszają możliwość `talk` i deklarują obsługiwane polecenia `talk.*`.
- Talk na iOS używa WebRTC należącego do klienta dla konfiguracji OpenAI realtime, które wybierają `webrtc` albo pomijają transport. Jawne konfiguracje realtime `gateway-relay`, `provider-websocket` i inne niż OpenAI pozostają przy przekaźniku należącym do Gateway; konfiguracje inne niż realtime używają natywnej pętli mowy.
- Talk w przeglądarce używa `talk.client.create` dla sesji `webrtc` i `provider-websocket` należących do klienta albo `talk.session.create` dla sesji `gateway-relay` należących do Gateway. `managed-room` jest zarezerwowane dla przekazywania przez Gateway i pokoi walkie-talkie.
- Talk na Androidzie może włączyć sesje przekaźnika realtime należące do Gateway za pomocą `talk.realtime.mode: "realtime"` i `talk.realtime.transport: "gateway-relay"`. W przeciwnym razie pozostaje przy natywnym rozpoznawaniu mowy, czacie Gateway i `talk.speak`.
- Klienci wyłącznie transkrypcyjni używają `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, a następnie `talk.session.appendAudio`, `talk.session.cancelTurn` i `talk.session.close`, gdy potrzebują napisów lub dyktowania bez głosowej odpowiedzi asystenta.

Natywny Talk to ciągła pętla rozmowy głosowej:

1. Nasłuch mowy
2. Wysłanie transkryptu do modelu przez aktywną sesję
3. Oczekiwanie na odpowiedź
4. Odtworzenie jej głosem przez skonfigurowanego dostawcę Talk (`talk.speak`)

Talk realtime należący do klienta przekazuje wywołania narzędzi dostawcy przez `talk.client.toolCall`; ci klienci nie wywołują bezpośrednio `chat.send` dla konsultacji realtime.
Gdy konsultacja realtime jest aktywna, klienci Talk mogą używać `talk.client.steer` lub
`talk.session.steer`, aby klasyfikować wypowiedź jako `status`, `steer`, `cancel` lub
`followup`. Zaakceptowane sterowanie trafia do kolejki aktywnego osadzonego uruchomienia; odrzucone
sterowanie zwraca ustrukturyzowany powód, taki jak `no_active_run`, `not_streaming`
lub `compacting`.

Talk wyłącznie transkrypcyjny emituje tę samą wspólną kopertę zdarzeń Talk co sesje realtime i STT/TTS, ale używa `mode: "transcription"` i `brain: "none"`. Służy do napisów, dyktowania i przechwytywania mowy tylko do obserwacji; jednorazowo przesłane notatki głosowe nadal używają ścieżki media/audio.

## Zachowanie (macOS)

- **Zawsze włączona nakładka**, gdy tryb Talk jest włączony.
- Przejścia faz **Nasłuchiwanie → Myślenie → Mówienie**.
- Przy **krótkiej pauzie** (okno ciszy) bieżący transkrypt jest wysyłany.
- Odpowiedzi są **zapisywane w WebChat** (tak samo jak przy pisaniu).
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
- Bez `once` głos staje się nową wartością domyślną dla trybu Talk.
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
- `silenceTimeoutMs`: gdy nie ustawiono, Talk zachowuje domyślne okno pauzy platformy przed wysłaniem transkryptu (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: wybiera aktywnego dostawcę Talk. Użyj `elevenlabs`, `mlx` lub `system` dla lokalnych ścieżek odtwarzania na macOS.
- `providers.<provider>.voiceId`: wraca do `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` dla ElevenLabs (lub pierwszego głosu ElevenLabs, gdy dostępny jest klucz API).
- `providers.elevenlabs.modelId`: domyślnie `eleven_v3`, gdy nie ustawiono.
- `providers.mlx.modelId`: domyślnie `mlx-community/Soprano-80M-bf16`, gdy nie ustawiono.
- `providers.elevenlabs.apiKey`: wraca do `ELEVENLABS_API_KEY` (lub profilu powłoki gateway, jeśli jest dostępny).
- `consultThinkingLevel`: opcjonalne nadpisanie poziomu myślenia dla pełnego uruchomienia agenta OpenClaw za wywołaniami realtime `openclaw_agent_consult`.
- `consultFastMode`: opcjonalne nadpisanie trybu szybkiego dla wywołań realtime `openclaw_agent_consult`.
- `realtime.provider`: wybiera aktywnego dostawcę głosu realtime. Użyj `openai` dla WebRTC, `google` dla WebSocket dostawcy albo dostawcy wyłącznie mostkującego przez przekaźnik Gateway.
- `realtime.providers.<provider>` przechowuje konfigurację realtime należącą do dostawcy. Przeglądarka otrzymuje tylko efemeryczne lub ograniczone poświadczenia sesji, nigdy standardowy klucz API.
- `realtime.providers.openai.voice`: wbudowany identyfikator głosu OpenAI Realtime. Obecne głosy `gpt-realtime-2` to `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` i `cedar`; `marin` oraz `cedar` są zalecane dla najlepszej jakości.
- `realtime.transport`: `webrtc` używa należącego do klienta OpenAI WebRTC na iOS i w przeglądarce. `provider-websocket` należy do przeglądarki, ale na iOS pozostaje przy przekaźniku Gateway. `gateway-relay` utrzymuje audio dostawcy na Gateway; Android używa realtime tylko dla tego transportu, a w innym przypadku zachowuje własną natywną pętlę STT/TTS.
- `realtime.brain`: `agent-consult` kieruje wywołania narzędzi realtime przez politykę Gateway; `direct-tools` to starsze zachowanie zgodności narzędzi bezpośrednich; `none` służy do transkrypcji lub zewnętrznej orkiestracji.
- `realtime.consultRouting`: `provider-direct` zachowuje bezpośrednią odpowiedź dostawcy, gdy pomija `openclaw_agent_consult`; `force-agent-consult` sprawia, że przekaźnik Gateway kieruje sfinalizowane transkrypty użytkownika przez OpenClaw.
- `realtime.instructions`: dodaje instrukcje systemowe dla dostawcy do wbudowanego promptu realtime OpenClaw. Używaj tego do stylu i tonu głosu; OpenClaw zachowuje domyślne wskazówki `openclaw_agent_consult`.
- `talk.catalog` udostępnia prawidłowe tryby, transporty, strategie brain, formaty audio realtime i flagi możliwości każdego dostawcy, aby klienci Talk pierwszej strony mogli unikać nieobsługiwanych kombinacji.
- Dostawcy transkrypcji strumieniowej są wykrywani przez `talk.catalog.transcription`. Obecny przekaźnik Gateway używa konfiguracji dostawcy strumieniowego Voice Call, dopóki nie zostanie dodana dedykowana powierzchnia konfiguracji transkrypcji Talk.
- `speechLocale`: opcjonalny identyfikator ustawień regionalnych BCP 47 dla rozpoznawania mowy Talk na urządzeniu w iOS/macOS. Pozostaw nieustawione, aby użyć domyślnego ustawienia urządzenia.
- `outputFormat`: domyślnie `pcm_44100` na macOS/iOS i `pcm_24000` na Androidzie (ustaw `mp3_*`, aby wymusić strumieniowanie MP3)

## Interfejs macOS

- Przełącznik na pasku menu: **Talk**
- Karta konfiguracji: grupa **Tryb Talk** (identyfikator głosu + przełącznik przerwania)
- Nakładka:
  - **Nasłuchiwanie**: chmura pulsuje wraz z poziomem mikrofonu
  - **Myślenie**: animacja opadania
  - **Mówienie**: promieniujące pierścienie
  - Kliknięcie chmury: zatrzymanie mówienia
  - Kliknięcie X: wyjście z trybu Talk

## Interfejs Androida

- Przełącznik karty głosu: **Talk**
- Ręczne tryby **Mikrofon** i **Talk** wzajemnie wykluczają się jako tryby przechwytywania w czasie działania.
- Ręczny mikrofon i Talk realtime preferują podłączony mikrofon zestawu słuchawkowego Bluetooth Classic lub BLE. Jeśli zostanie rozłączony, aplikacja zażąda innego wejścia zestawu słuchawkowego albo pozwoli Androidowi użyć domyślnego mikrofonu; zatrzymanie przechwytywania przywraca domyślną preferencję mikrofonu.
- Ręczny mikrofon zatrzymuje się, gdy aplikacja opuszcza pierwszy plan lub użytkownik opuszcza kartę Głos.
- Tryb Talk działa do momentu wyłączenia przełącznikiem albo rozłączenia węzła Androida i podczas działania używa typu usługi pierwszoplanowej mikrofonu Androida.

## Uwagi

- Wymaga uprawnień do mowy i mikrofonu.
- Natywny Talk używa aktywnej sesji Gateway i wraca do odpytywania historii tylko wtedy, gdy zdarzenia odpowiedzi są niedostępne.
- Talk realtime należący do klienta używa `talk.client.toolCall` dla `openclaw_agent_consult` zamiast udostępniać `chat.send` sesjom należącym do dostawcy.
- Talk wyłącznie transkrypcyjny używa `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` i `talk.session.close`; klienci subskrybują `talk.event`, aby otrzymywać częściowe/końcowe aktualizacje transkryptu.
- Gateway rozwiązuje odtwarzanie Talk przez `talk.speak`, używając aktywnego dostawcy Talk. Android wraca do lokalnego systemowego TTS tylko wtedy, gdy to RPC jest niedostępne.
- Lokalne odtwarzanie MLX w macOS używa dołączonego pomocnika `openclaw-mlx-tts`, gdy jest obecny, albo pliku wykonywalnego w `PATH`. Ustaw `OPENCLAW_MLX_TTS_BIN`, aby wskazać niestandardowy binarny plik pomocnika podczas tworzenia.
- `stability` dla `eleven_v3` jest walidowane do `0.0`, `0.5` lub `1.0`; inne modele akceptują `0..1`.
- `latency_tier` jest walidowane do `0..4`, gdy jest ustawione.
- Android obsługuje formaty wyjściowe `pcm_16000`, `pcm_22050`, `pcm_24000` i `pcm_44100` dla strumieniowania AudioTrack o niskim opóźnieniu.

## Powiązane

- [Wybudzanie głosem](/pl/nodes/voicewake)
- [Audio i notatki głosowe](/pl/nodes/audio)
- [Rozumienie mediów](/pl/nodes/media-understanding)
