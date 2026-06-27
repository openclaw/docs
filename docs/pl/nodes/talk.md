---
read_when:
    - Implementowanie trybu Talk w systemach macOS/iOS/Android
    - Zmiana działania głosu/TTS/przerywania
summary: 'Tryb rozmowy: ciągłe konwersacje głosowe z użyciem lokalnego STT/TTS i głosu w czasie rzeczywistym'
title: Tryb rozmowy
x-i18n:
    generated_at: "2026-06-27T17:45:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 47ae6c1abc763688ab5bbea1c23c9f4f27fe2f4b13cfade61917f5a1a912f057
    source_path: nodes/talk.md
    workflow: 16
---

Tryb rozmowy ma dwa kształty wykonawcze:

- Natywna rozmowa w macOS/iOS/Androidzie używa lokalnego rozpoznawania mowy, czatu Gateway oraz TTS `talk.speak`. Węzły ogłaszają zdolność `talk` i deklarują obsługiwane polecenia `talk.*`.
- Rozmowa w przeglądarce używa `talk.client.create` dla należących do klienta sesji `webrtc` i `provider-websocket` albo `talk.session.create` dla należących do Gateway sesji `gateway-relay`. `managed-room` jest zarezerwowane dla przekazania przez Gateway i pokoi krótkofalowych.
- Rozmowa na Androidzie może wybrać należące do Gateway sesje przekaźnika czasu rzeczywistego z `talk.realtime.mode: "realtime"` i `talk.realtime.transport: "gateway-relay"`. W przeciwnym razie pozostaje przy natywnym rozpoznawaniu mowy, czacie Gateway i `talk.speak`.
- Klienci tylko do transkrypcji używają `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, a następnie `talk.session.appendAudio`, `talk.session.cancelTurn` i `talk.session.close`, gdy potrzebują napisów lub dyktowania bez głosowej odpowiedzi asystenta.

Natywna rozmowa to ciągła pętla konwersacji głosowej:

1. Nasłuchuj mowy
2. Wyślij transkrypt do modelu przez aktywną sesję
3. Poczekaj na odpowiedź
4. Odtwórz ją przez skonfigurowanego dostawcę rozmowy (`talk.speak`)

Rozmowa w czasie rzeczywistym w przeglądarce przekazuje wywołania narzędzi dostawcy przez `talk.client.toolCall`; klienci przeglądarkowi nie wywołują `chat.send` bezpośrednio dla konsultacji w czasie rzeczywistym.
Gdy konsultacja w czasie rzeczywistym jest aktywna, klienci rozmowy mogą używać `talk.client.steer` lub
`talk.session.steer`, aby klasyfikować wejście mówione jako `status`, `steer`, `cancel` albo
`followup`. Zaakceptowane sterowanie trafia do kolejki aktywnego osadzonego uruchomienia; odrzucone
sterowanie zwraca ustrukturyzowany powód, taki jak `no_active_run`, `not_streaming`
albo `compacting`.

Rozmowa tylko do transkrypcji emituje tę samą wspólną kopertę zdarzeń rozmowy co sesje czasu rzeczywistego i STT/TTS, ale używa `mode: "transcription"` i `brain: "none"`. Służy do napisów, dyktowania i przechwytywania mowy tylko do obserwacji; jednorazowo przesłane notatki głosowe nadal używają ścieżki multimediów/audio.

## Zachowanie (macOS)

- **Nakładka zawsze włączona**, gdy tryb rozmowy jest włączony.
- Przejścia faz **Nasłuchiwanie → Myślenie → Mówienie**.
- Po **krótkiej pauzie** (okno ciszy) bieżący transkrypt jest wysyłany.
- Odpowiedzi są **zapisywane w WebChat** (tak samo jak wpisywanie).
- **Przerwanie mową** (domyślnie włączone): jeśli użytkownik zacznie mówić, gdy asystent mówi, zatrzymujemy odtwarzanie i zapisujemy znacznik czasu przerwania dla następnego promptu.

## Dyrektywy głosowe w odpowiedziach

Asystent może poprzedzić odpowiedź **pojedynczym wierszem JSON**, aby sterować głosem:

```json
{ "voice": "<voice-id>", "once": true }
```

Zasady:

- Tylko pierwszy niepusty wiersz.
- Nieznane klucze są ignorowane.
- `once: true` dotyczy tylko bieżącej odpowiedzi.
- Bez `once` głos staje się nową wartością domyślną dla trybu rozmowy.
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
- `silenceTimeoutMs`: gdy nie jest ustawione, rozmowa zachowuje domyślne okno pauzy platformy przed wysłaniem transkryptu (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: wybiera aktywnego dostawcę rozmowy. Użyj `elevenlabs`, `mlx` albo `system` dla lokalnych ścieżek odtwarzania w macOS.
- `providers.<provider>.voiceId`: wraca do `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` dla ElevenLabs (albo pierwszego głosu ElevenLabs, gdy klucz API jest dostępny).
- `providers.elevenlabs.modelId`: domyślnie `eleven_v3`, gdy nie jest ustawione.
- `providers.mlx.modelId`: domyślnie `mlx-community/Soprano-80M-bf16`, gdy nie jest ustawione.
- `providers.elevenlabs.apiKey`: wraca do `ELEVENLABS_API_KEY` (albo profilu powłoki gateway, jeśli jest dostępny).
- `consultThinkingLevel`: opcjonalne nadpisanie poziomu myślenia dla pełnego uruchomienia agenta OpenClaw za wywołaniami `openclaw_agent_consult` w czasie rzeczywistym.
- `consultFastMode`: opcjonalne nadpisanie trybu szybkiego dla wywołań `openclaw_agent_consult` w czasie rzeczywistym.
- `realtime.provider`: wybiera aktywnego przeglądarkowego/serwerowego dostawcę głosu czasu rzeczywistego. Użyj `openai` dla WebRTC, `google` dla WebSocket dostawcy albo dostawcy tylko mostkującego przez przekaźnik Gateway.
- `realtime.providers.<provider>` przechowuje należącą do dostawcy konfigurację czasu rzeczywistego. Przeglądarka otrzymuje tylko efemeryczne lub ograniczone poświadczenia sesji, nigdy standardowy klucz API.
- `realtime.providers.openai.voice`: wbudowany identyfikator głosu OpenAI Realtime. Bieżące głosy `gpt-realtime-2` to `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` i `cedar`; `marin` i `cedar` są zalecane dla najlepszej jakości.
- `realtime.transport`: `webrtc` i `provider-websocket` to przeglądarkowe transporty czasu rzeczywistego. Android używa przekaźnika czasu rzeczywistego tylko wtedy, gdy jest to `gateway-relay`; w przeciwnym razie rozmowa na Androidzie używa natywnej pętli STT/TTS.
- `realtime.brain`: `agent-consult` kieruje wywołania narzędzi czasu rzeczywistego przez politykę Gateway; `direct-tools` to starsze zachowanie zgodności bezpośrednich narzędzi; `none` jest przeznaczone do transkrypcji lub orkiestracji zewnętrznej.
- `realtime.consultRouting`: `provider-direct` zachowuje bezpośrednią odpowiedź dostawcy, gdy pomija `openclaw_agent_consult`; `force-agent-consult` sprawia, że przekaźnik Gateway kieruje sfinalizowane transkrypty użytkownika przez OpenClaw.
- `realtime.instructions`: dodaje skierowane do dostawcy instrukcje systemowe do wbudowanego promptu czasu rzeczywistego OpenClaw. Użyj tego dla stylu i tonu głosu; OpenClaw zachowuje domyślne wskazówki `openclaw_agent_consult`.
- `talk.catalog` udostępnia prawidłowe tryby, transporty, strategie mózgu, formaty audio czasu rzeczywistego i flagi zdolności każdego dostawcy, aby klienci rozmowy pierwszej strony mogli unikać nieobsługiwanych kombinacji.
- Dostawcy strumieniowej transkrypcji są wykrywani przez `talk.catalog.transcription`. Bieżący przekaźnik Gateway używa konfiguracji dostawcy strumieniowego połączeń głosowych, dopóki nie zostanie dodana dedykowana powierzchnia konfiguracji transkrypcji rozmowy.
- `speechLocale`: opcjonalny identyfikator locale BCP 47 dla rozpoznawania mowy rozmowy na urządzeniu w iOS/macOS. Pozostaw nieustawione, aby użyć wartości domyślnej urządzenia.
- `outputFormat`: domyślnie `pcm_44100` w macOS/iOS i `pcm_24000` na Androidzie (ustaw `mp3_*`, aby wymusić strumieniowanie MP3)

## Interfejs macOS

- Przełącznik paska menu: **Rozmowa**
- Karta konfiguracji: grupa **Tryb rozmowy** (identyfikator głosu + przełącznik przerywania)
- Nakładka:
  - **Nasłuchiwanie**: chmura pulsuje wraz z poziomem mikrofonu
  - **Myślenie**: animacja opadania
  - **Mówienie**: promieniujące pierścienie
  - Kliknięcie chmury: zatrzymaj mówienie
  - Kliknięcie X: wyjdź z trybu rozmowy

## Interfejs Androida

- Przełącznik karty głosu: **Rozmowa**
- Ręczny **Mikrofon** i **Rozmowa** to wzajemnie wykluczające się tryby przechwytywania w czasie wykonania.
- Ręczny mikrofon zatrzymuje się, gdy aplikacja opuszcza pierwszy plan albo użytkownik opuszcza kartę Głos.
- Tryb rozmowy działa do czasu wyłączenia przełącznikiem albo rozłączenia węzła Androida i podczas aktywności używa typu usługi pierwszoplanowej mikrofonu Androida.

## Uwagi

- Wymaga uprawnień do mowy i mikrofonu.
- Natywna rozmowa używa aktywnej sesji Gateway i wraca do odpytywania historii tylko wtedy, gdy zdarzenia odpowiedzi są niedostępne.
- Rozmowa w czasie rzeczywistym w przeglądarce używa `talk.client.toolCall` dla `openclaw_agent_consult` zamiast udostępniać `chat.send` należącym do dostawcy sesjom przeglądarkowym.
- Rozmowa tylko do transkrypcji używa `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` i `talk.session.close`; klienci subskrybują `talk.event` dla częściowych/końcowych aktualizacji transkryptu.
- Gateway rozwiązuje odtwarzanie rozmowy przez `talk.speak` z użyciem aktywnego dostawcy rozmowy. Android wraca do lokalnego systemowego TTS tylko wtedy, gdy to RPC jest niedostępne.
- Lokalne odtwarzanie MLX w macOS używa dołączonego pomocnika `openclaw-mlx-tts`, gdy jest obecny, albo pliku wykonywalnego w `PATH`. Ustaw `OPENCLAW_MLX_TTS_BIN`, aby wskazać niestandardowy binarny pomocnik podczas programowania.
- `stability` dla `eleven_v3` jest walidowane do `0.0`, `0.5` albo `1.0`; inne modele akceptują `0..1`.
- `latency_tier` jest walidowane do `0..4`, gdy jest ustawione.
- Android obsługuje formaty wyjściowe `pcm_16000`, `pcm_22050`, `pcm_24000` i `pcm_44100` dla niskolatencyjnego strumieniowania AudioTrack.

## Powiązane

- [Wybudzanie głosem](/pl/nodes/voicewake)
- [Audio i notatki głosowe](/pl/nodes/audio)
- [Rozumienie multimediów](/pl/nodes/media-understanding)
