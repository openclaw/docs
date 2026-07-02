---
read_when:
    - Implementowanie trybu Talk w systemach macOS/iOS/Android
    - Zmiana działania głosu/TTS/przerwań
summary: 'Tryb rozmowy: ciągłe konwersacje głosowe przez lokalne STT/TTS i głos w czasie rzeczywistym'
title: Tryb rozmowy
x-i18n:
    generated_at: "2026-07-02T22:51:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 696e9693cd6b4a18500221230db17c94ffd01fe6f9c7fcf271b74072bb035a82
    source_path: nodes/talk.md
    workflow: 16
---

Tryb Talk ma dwa kształty wykonawcze:

- Natywny Talk w macOS/iOS/Android używa lokalnego rozpoznawania mowy, czatu Gateway oraz TTS `talk.speak`. Węzły ogłaszają zdolność `talk` i deklarują obsługiwane polecenia `talk.*`.
- Talk w iOS używa należącego do klienta WebRTC dla konfiguracji realtime OpenAI, które wybierają `webrtc` albo pomijają transport. Jawne konfiguracje realtime `gateway-relay`, `provider-websocket` oraz inne niż OpenAI pozostają na przekaźniku należącym do Gateway; konfiguracje inne niż realtime używają natywnej pętli mowy.
- Talk w przeglądarce używa `talk.client.create` dla należących do klienta sesji `webrtc` i `provider-websocket` albo `talk.session.create` dla należących do Gateway sesji `gateway-relay`. `managed-room` jest zarezerwowane dla przekazania do Gateway i pokoi walkie-talkie.
- Talk w Androidzie może włączyć należące do Gateway sesje przekaźnika realtime za pomocą `talk.realtime.mode: "realtime"` i `talk.realtime.transport: "gateway-relay"`. W przeciwnym razie pozostaje przy natywnym rozpoznawaniu mowy, czacie Gateway i `talk.speak`.
- Klienci tylko do transkrypcji używają `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, a następnie `talk.session.appendAudio`, `talk.session.cancelTurn` i `talk.session.close`, gdy potrzebują napisów lub dyktowania bez głosowej odpowiedzi asystenta.

Natywny Talk to ciągła pętla rozmowy głosowej:

1. Nasłuchuj mowy
2. Wyślij transkrypcję do modelu przez aktywną sesję
3. Poczekaj na odpowiedź
4. Odtwórz ją przez skonfigurowanego dostawcę Talk (`talk.speak`)

Należący do klienta Talk realtime przekazuje wywołania narzędzi dostawcy przez `talk.client.toolCall`; ci klienci nie wywołują `chat.send` bezpośrednio dla konsultacji realtime.
Gdy konsultacja realtime jest aktywna, klienci Talk mogą użyć `talk.client.steer` lub
`talk.session.steer`, aby sklasyfikować wejście mówione jako `status`, `steer`, `cancel` lub
`followup`. Zaakceptowane sterowanie jest kolejkowane do aktywnego osadzonego uruchomienia; odrzucone
sterowanie zwraca ustrukturyzowany powód, taki jak `no_active_run`, `not_streaming`
lub `compacting`.

Talk tylko do transkrypcji emituje tę samą wspólną kopertę zdarzeń Talk co sesje realtime i STT/TTS, ale używa `mode: "transcription"` i `brain: "none"`. Jest przeznaczony do napisów, dyktowania i przechwytywania mowy tylko do obserwacji; jednorazowo przesłane notatki głosowe nadal używają ścieżki multimediów/audio.

## Zachowanie (macOS)

- **Zawsze widoczna nakładka**, gdy tryb Talk jest włączony.
- Przejścia faz **Nasłuchiwanie → Myślenie → Mówienie**.
- Po **krótkiej pauzie** (oknie ciszy) bieżąca transkrypcja jest wysyłana.
- Odpowiedzi są **zapisywane do WebChat** (tak samo jak przy pisaniu).
- **Przerwanie mową** (domyślnie włączone): jeśli użytkownik zacznie mówić, gdy asystent mówi, zatrzymujemy odtwarzanie i zapisujemy znacznik czasu przerwania na potrzeby następnego promptu.

## Dyrektywy głosowe w odpowiedziach

Asystent może poprzedzić swoją odpowiedź **pojedynczym wierszem JSON**, aby sterować głosem:

```json
{ "voice": "<voice-id>", "once": true }
```

Zasady:

- Tylko pierwszy niepusty wiersz.
- Nieznane klucze są ignorowane.
- `once: true` dotyczy tylko bieżącej odpowiedzi.
- Bez `once` głos staje się nowym domyślnym dla trybu Talk.
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
- `silenceTimeoutMs`: gdy nie jest ustawione, Talk zachowuje domyślne dla platformy okno pauzy przed wysłaniem transkrypcji (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: wybiera aktywnego dostawcę Talk. Użyj `elevenlabs`, `mlx` albo `system` dla lokalnych ścieżek odtwarzania w macOS.
- `providers.<provider>.voiceId`: dla ElevenLabs wraca do `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` (albo do pierwszego głosu ElevenLabs, gdy klucz API jest dostępny).
- `providers.elevenlabs.modelId`: domyślnie `eleven_v3`, gdy nie jest ustawione.
- `providers.mlx.modelId`: domyślnie `mlx-community/Soprano-80M-bf16`, gdy nie jest ustawione.
- `providers.elevenlabs.apiKey`: wraca do `ELEVENLABS_API_KEY` (albo do profilu powłoki Gateway, jeśli jest dostępny).
- `consultThinkingLevel`: opcjonalne nadpisanie poziomu myślenia dla pełnego uruchomienia agenta OpenClaw za wywołaniami realtime `openclaw_agent_consult`.
- `consultFastMode`: opcjonalne nadpisanie trybu szybkiego dla wywołań realtime `openclaw_agent_consult`.
- `realtime.provider`: wybiera aktywnego dostawcę głosu realtime. Użyj `openai` dla WebRTC, `google` dla WebSocket dostawcy albo dostawcy tylko pomostowego przez przekaźnik Gateway.
- `realtime.providers.<provider>` przechowuje należącą do dostawcy konfigurację realtime. Przeglądarka otrzymuje tylko efemeryczne lub ograniczone poświadczenia sesji, nigdy standardowy klucz API.
- `realtime.providers.openai.voice`: wbudowany identyfikator głosu OpenAI Realtime. Obecne głosy `gpt-realtime-2` to `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` i `cedar`; `marin` i `cedar` są zalecane dla najlepszej jakości.
- `realtime.transport`: `webrtc` używa należącego do klienta OpenAI WebRTC w iOS i w przeglądarce. `provider-websocket` należy do przeglądarki, ale w iOS pozostaje na przekaźniku Gateway. `gateway-relay` utrzymuje audio dostawcy na Gateway; Android używa realtime tylko dla tego transportu, a w przeciwnym razie zachowuje natywną pętlę STT/TTS.
- `realtime.brain`: `agent-consult` kieruje wywołania narzędzi realtime przez politykę Gateway; `direct-tools` to starsze zachowanie zgodności z narzędziami bezpośrednimi; `none` służy do transkrypcji lub zewnętrznej orkiestracji.
- `realtime.consultRouting`: `provider-direct` zachowuje bezpośrednią odpowiedź dostawcy, gdy pomija `openclaw_agent_consult`; `force-agent-consult` sprawia, że przekaźnik Gateway kieruje sfinalizowane transkrypcje użytkownika przez OpenClaw.
- `realtime.instructions`: dodaje instrukcje systemowe widoczne dla dostawcy do wbudowanego promptu realtime OpenClaw. Użyj tego do stylu i tonu głosu; OpenClaw zachowuje domyślne wskazówki `openclaw_agent_consult`.
- `talk.catalog` ujawnia prawidłowe tryby, transporty, strategie brain, formaty audio realtime i flagi zdolności każdego dostawcy, aby klienci Talk pierwszej strony mogli unikać nieobsługiwanych kombinacji.
- Dostawcy transkrypcji strumieniowej są wykrywani przez `talk.catalog.transcription`. Bieżący przekaźnik Gateway używa konfiguracji dostawcy strumieniowego Voice Call, dopóki nie zostanie dodana dedykowana powierzchnia konfiguracji transkrypcji Talk.
- `speechLocale`: opcjonalny identyfikator lokalizacji BCP 47 dla rozpoznawania mowy Talk na urządzeniu w iOS/macOS. Pozostaw nieustawione, aby użyć ustawienia domyślnego urządzenia.
- `outputFormat`: domyślnie `pcm_44100` w macOS/iOS i `pcm_24000` w Androidzie (ustaw `mp3_*`, aby wymusić strumieniowanie MP3)

## Interfejs użytkownika macOS

- Przełącznik na pasku menu: **Talk**
- Karta konfiguracji: grupa **Tryb Talk** (identyfikator głosu + przełącznik przerwania)
- Nakładka:
  - **Nasłuchiwanie**: chmura pulsuje z poziomem mikrofonu
  - **Myślenie**: animacja opadania
  - **Mówienie**: promieniujące pierścienie
  - Kliknięcie chmury: zatrzymaj mówienie
  - Kliknięcie X: wyjdź z trybu Talk

## Interfejs użytkownika Androida

- Przełącznik karty głosowej: **Talk**
- Ręczne tryby **Mic** i **Talk** wzajemnie wykluczają przechwytywanie w czasie działania.
- Ręczny Mic zatrzymuje się, gdy aplikacja opuszcza pierwszy plan albo użytkownik opuszcza kartę Voice.
- Tryb Talk działa, dopóki nie zostanie wyłączony przełącznikiem albo węzeł Androida się nie rozłączy, i podczas aktywności używa androidowego typu usługi pierwszoplanowej mikrofonu.

## Uwagi

- Wymaga uprawnień do mowy i mikrofonu.
- Natywny Talk używa aktywnej sesji Gateway i wraca do odpytywania historii tylko wtedy, gdy zdarzenia odpowiedzi są niedostępne.
- Należący do klienta Talk realtime używa `talk.client.toolCall` dla `openclaw_agent_consult`, zamiast ujawniać `chat.send` sesjom należącym do dostawcy.
- Talk tylko do transkrypcji używa `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` i `talk.session.close`; klienci subskrybują `talk.event`, aby otrzymywać częściowe/końcowe aktualizacje transkrypcji.
- Gateway rozwiązuje odtwarzanie Talk przez `talk.speak`, używając aktywnego dostawcy Talk. Android wraca do lokalnego systemowego TTS tylko wtedy, gdy ten RPC jest niedostępny.
- Lokalne odtwarzanie MLX w macOS używa dołączonego pomocnika `openclaw-mlx-tts`, gdy jest obecny, albo pliku wykonywalnego w `PATH`. Ustaw `OPENCLAW_MLX_TTS_BIN`, aby wskazać niestandardowy binarny plik pomocnika podczas programowania.
- `stability` dla `eleven_v3` jest walidowane do `0.0`, `0.5` lub `1.0`; inne modele akceptują `0..1`.
- `latency_tier` jest walidowane do `0..4`, gdy jest ustawione.
- Android obsługuje formaty wyjściowe `pcm_16000`, `pcm_22050`, `pcm_24000` i `pcm_44100` dla niskoopóźnieniowego strumieniowania AudioTrack.

## Powiązane

- [Wybudzanie głosem](/pl/nodes/voicewake)
- [Audio i notatki głosowe](/pl/nodes/audio)
- [Rozumienie mediów](/pl/nodes/media-understanding)
