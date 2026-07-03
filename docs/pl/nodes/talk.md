---
read_when:
    - Implementowanie trybu Talk na macOS/iOS/Android
    - Zmiana zachowania głosu/TTS/przerywania
summary: 'Tryb rozmowy: ciągłe konwersacje głosowe przez lokalne STT/TTS i głos w czasie rzeczywistym'
title: Tryb rozmowy
x-i18n:
    generated_at: "2026-07-03T10:00:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9c8cdb6ffef7575348e94b36cd73a0613c336d8e811d6ce46d7518ee7c34b14
    source_path: nodes/talk.md
    workflow: 16
---

Tryb rozmowy ma dwa kształty działania:

- Natywna rozmowa w macOS/iOS/Android używa lokalnego rozpoznawania mowy, czatu Gateway i TTS `talk.speak`. Węzły ogłaszają zdolność `talk` i deklarują obsługiwane polecenia `talk.*`.
- Rozmowa w iOS używa WebRTC zarządzanego przez klienta dla konfiguracji czasu rzeczywistego OpenAI, które wybierają `webrtc` albo pomijają transport. Jawne konfiguracje czasu rzeczywistego `gateway-relay`, `provider-websocket` i inne niż OpenAI pozostają przy przekaźniku zarządzanym przez Gateway; konfiguracje inne niż czasu rzeczywistego używają natywnej pętli mowy.
- Rozmowa w przeglądarce używa `talk.client.create` dla sesji `webrtc` i `provider-websocket` zarządzanych przez klienta albo `talk.session.create` dla sesji `gateway-relay` zarządzanych przez Gateway. `managed-room` jest zarezerwowane dla przekazania do Gateway i pokojów walkie-talkie.
- Rozmowa w Androidzie może włączyć sesje przekaźnika czasu rzeczywistego zarządzane przez Gateway za pomocą `talk.realtime.mode: "realtime"` i `talk.realtime.transport: "gateway-relay"`. W przeciwnym razie pozostaje przy natywnym rozpoznawaniu mowy, czacie Gateway i `talk.speak`.
- Klienci tylko do transkrypcji używają `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, a następnie `talk.session.appendAudio`, `talk.session.cancelTurn` i `talk.session.close`, gdy potrzebują napisów lub dyktowania bez głosowej odpowiedzi asystenta.

Natywna rozmowa to ciągła pętla konwersacji głosowej:

1. Nasłuchuj mowy
2. Wyślij transkrypt do modelu przez aktywną sesję
3. Poczekaj na odpowiedź
4. Odtwórz ją przez skonfigurowanego dostawcę rozmowy (`talk.speak`)

Rozmowa czasu rzeczywistego zarządzana przez klienta przekazuje wywołania narzędzi dostawcy przez `talk.client.toolCall`; ci klienci nie wywołują bezpośrednio `chat.send` dla konsultacji czasu rzeczywistego.
Gdy konsultacja czasu rzeczywistego jest aktywna, klienci rozmowy mogą używać `talk.client.steer` albo
`talk.session.steer`, aby klasyfikować wypowiedź jako `status`, `steer`, `cancel` albo
`followup`. Zaakceptowane sterowanie jest kolejkowane do aktywnego osadzonego uruchomienia; odrzucone
sterowanie zwraca ustrukturyzowany powód, taki jak `no_active_run`, `not_streaming`
albo `compacting`.

Rozmowa tylko do transkrypcji emituje tę samą wspólną kopertę zdarzeń rozmowy co sesje czasu rzeczywistego i STT/TTS, ale używa `mode: "transcription"` i `brain: "none"`. Jest przeznaczona do napisów, dyktowania i przechwytywania mowy wyłącznie obserwacyjnie; jednorazowe przesłane notatki głosowe nadal używają ścieżki mediów/audio.

## Zachowanie (macOS)

- **Nakładka zawsze włączona**, gdy tryb rozmowy jest włączony.
- Przejścia faz **Nasłuchiwanie → Myślenie → Mówienie**.
- Po **krótkiej pauzie** (oknie ciszy) bieżący transkrypt jest wysyłany.
- Odpowiedzi są **zapisywane w WebChat** (tak samo jak wpisywanie).
- **Przerywanie przy mowie** (domyślnie włączone): jeśli użytkownik zacznie mówić, gdy asystent mówi, zatrzymujemy odtwarzanie i zapisujemy znacznik czasu przerwania dla następnego promptu.

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
- `silenceTimeoutMs`: gdy nieustawione, rozmowa zachowuje domyślne dla platformy okno pauzy przed wysłaniem transkryptu (`700 ms w macOS i Androidzie, 900 ms w iOS`)
- `provider`: wybiera aktywnego dostawcę rozmowy. Użyj `elevenlabs`, `mlx` albo `system` dla lokalnych ścieżek odtwarzania w macOS.
- `providers.<provider>.voiceId`: przechodzi awaryjnie na `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` dla ElevenLabs (albo pierwszy głos ElevenLabs, gdy klucz API jest dostępny).
- `providers.elevenlabs.modelId`: domyślnie `eleven_v3`, gdy nieustawione.
- `providers.mlx.modelId`: domyślnie `mlx-community/Soprano-80M-bf16`, gdy nieustawione.
- `providers.elevenlabs.apiKey`: przechodzi awaryjnie na `ELEVENLABS_API_KEY` (albo profil powłoki Gateway, jeśli jest dostępny).
- `consultThinkingLevel`: opcjonalne nadpisanie poziomu myślenia dla pełnego uruchomienia agenta OpenClaw za wywołaniami `openclaw_agent_consult` czasu rzeczywistego.
- `consultFastMode`: opcjonalne nadpisanie trybu szybkiego dla wywołań `openclaw_agent_consult` czasu rzeczywistego.
- `realtime.provider`: wybiera aktywnego dostawcę głosu czasu rzeczywistego. Użyj `openai` dla WebRTC, `google` dla WebSocket dostawcy albo dostawcy tylko mostkującego przez przekaźnik Gateway.
- `realtime.providers.<provider>` przechowuje konfigurację czasu rzeczywistego należącą do dostawcy. Przeglądarka otrzymuje tylko tymczasowe lub ograniczone dane uwierzytelniające sesji, nigdy standardowy klucz API.
- `realtime.providers.openai.voice`: wbudowany identyfikator głosu OpenAI Realtime. Obecne głosy `gpt-realtime-2` to `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` i `cedar`; `marin` i `cedar` są zalecane dla najlepszej jakości.
- `realtime.transport`: `webrtc` używa WebRTC OpenAI zarządzanego przez klienta w iOS i w przeglądarce. `provider-websocket` jest zarządzane przez przeglądarkę, ale w iOS pozostaje przy przekaźniku Gateway. `gateway-relay` utrzymuje audio dostawcy w Gateway; Android używa czasu rzeczywistego tylko dla tego transportu, a w pozostałych przypadkach zachowuje natywną pętlę STT/TTS.
- `realtime.brain`: `agent-consult` kieruje wywołania narzędzi czasu rzeczywistego przez politykę Gateway; `direct-tools` to starsze zachowanie zgodności narzędzi bezpośrednich; `none` służy do transkrypcji lub zewnętrznej orkiestracji.
- `realtime.consultRouting`: `provider-direct` zachowuje bezpośrednią odpowiedź dostawcy, gdy pomija `openclaw_agent_consult`; `force-agent-consult` sprawia, że przekaźnik Gateway kieruje sfinalizowane transkrypty użytkownika przez OpenClaw.
- `realtime.instructions`: dołącza instrukcje systemowe widoczne dla dostawcy do wbudowanego promptu czasu rzeczywistego OpenClaw. Użyj tego do stylu i tonu głosu; OpenClaw zachowuje domyślne wskazówki `openclaw_agent_consult`.
- `talk.catalog` udostępnia kanoniczne identyfikatory dostawców i aliasy rejestru wraz z prawidłowymi trybami, transportami, strategiami mózgu, formatami audio czasu rzeczywistego, flagami zdolności i wynikiem gotowości wybranym przez środowisko uruchomieniowe dla każdego dostawcy. Własne klienty rozmowy powinny używać tego katalogu zamiast lokalnie utrzymywać aliasy dostawców; starszy Gateway, który pomija gotowość grupy, jest niezweryfikowany, a nie definitywnie nieskonfigurowany.
- Dostawcy transkrypcji strumieniowej są wykrywani przez `talk.catalog.transcription`. Obecny przekaźnik Gateway używa konfiguracji dostawcy strumieniowego Voice Call do czasu dodania dedykowanej powierzchni konfiguracji transkrypcji rozmowy.
- `speechLocale`: opcjonalny identyfikator lokalizacji BCP 47 dla rozpoznawania mowy rozmowy na urządzeniu w iOS/macOS. Pozostaw nieustawione, aby użyć wartości domyślnej urządzenia.
- `outputFormat`: domyślnie `pcm_44100` w macOS/iOS i `pcm_24000` w Androidzie (ustaw `mp3_*`, aby wymusić strumieniowanie MP3)

## Interfejs macOS

- Przełącznik na pasku menu: **Rozmowa**
- Karta konfiguracji: grupa **Tryb rozmowy** (identyfikator głosu + przełącznik przerwania)
- Nakładka:
  - **Nasłuchiwanie**: chmura pulsuje poziomem mikrofonu
  - **Myślenie**: animacja opadania
  - **Mówienie**: promieniujące pierścienie
  - Kliknij chmurę: zatrzymaj mówienie
  - Kliknij X: wyjdź z trybu rozmowy

## Interfejs Android

- Przełącznik na karcie głosu: **Rozmowa**
- Ręczne tryby **Mikrofon** i **Rozmowa** są wzajemnie wykluczającymi się trybami przechwytywania w czasie działania.
- Ręczny mikrofon i rozmowa czasu rzeczywistego preferują podłączony mikrofon zestawu słuchawkowego Bluetooth Classic lub BLE. Jeśli się rozłączy, aplikacja żąda innego wejścia zestawu słuchawkowego albo pozwala Androidowi użyć domyślnego mikrofonu; zatrzymanie przechwytywania przywraca preferencję domyślnego mikrofonu.
- Ręczny mikrofon zatrzymuje się, gdy aplikacja opuszcza pierwszy plan albo użytkownik opuszcza kartę Głos.
- Tryb rozmowy działa, dopóki nie zostanie wyłączony lub węzeł Androida się nie rozłączy, i podczas aktywności używa typu usługi pierwszoplanowej mikrofonu Androida.

## Uwagi

- Wymaga uprawnień do mowy i mikrofonu.
- Natywna rozmowa używa aktywnej sesji Gateway i przechodzi awaryjnie na odpytywanie historii tylko wtedy, gdy zdarzenia odpowiedzi są niedostępne.
- Rozmowa czasu rzeczywistego zarządzana przez klienta używa `talk.client.toolCall` dla `openclaw_agent_consult` zamiast wystawiać `chat.send` sesjom zarządzanym przez dostawcę.
- Rozmowa tylko do transkrypcji używa `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` i `talk.session.close`; klienci subskrybują `talk.event`, aby otrzymywać częściowe/końcowe aktualizacje transkryptu.
- Gateway rozwiązuje odtwarzanie rozmowy przez `talk.speak`, używając aktywnego dostawcy rozmowy. Android przechodzi awaryjnie na lokalne systemowe TTS tylko wtedy, gdy ten RPC jest niedostępny.
- Lokalne odtwarzanie MLX w macOS używa dołączonego pomocnika `openclaw-mlx-tts`, gdy jest obecny, albo pliku wykonywalnego w `PATH`. Ustaw `OPENCLAW_MLX_TTS_BIN`, aby podczas programowania wskazać niestandardowy binarny plik pomocnika.
- `stability` dla `eleven_v3` jest walidowane do `0.0`, `0.5` albo `1.0`; inne modele akceptują `0..1`.
- `latency_tier` jest walidowane do `0..4`, gdy jest ustawione.
- Android obsługuje formaty wyjściowe `pcm_16000`, `pcm_22050`, `pcm_24000` i `pcm_44100` dla strumieniowania AudioTrack o niskim opóźnieniu.

## Powiązane

- [Wybudzanie głosem](/pl/nodes/voicewake)
- [Audio i notatki głosowe](/pl/nodes/audio)
- [Rozumienie mediów](/pl/nodes/media-understanding)
