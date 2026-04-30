---
read_when:
    - Szukasz omówienia możliwości multimedialnych OpenClaw
    - Wybór dostawcy mediów do skonfigurowania
    - Zrozumienie, jak działa asynchroniczne generowanie multimediów
sidebarTitle: Media overview
summary: Możliwości dotyczące obrazu, wideo, muzyki, mowy i rozumienia mediów w skrócie
title: Przegląd multimediów
x-i18n:
    generated_at: "2026-04-30T10:23:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9f40e4fb86832438ae99dd2dc42da93c41937541314d95486c97c210dfef508
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw generuje obrazy, filmy i muzykę, rozumie przychodzące multimedia
(obrazy, dźwięk, wideo) i wypowiada odpowiedzi na głos za pomocą syntezy mowy. Wszystkie
możliwości multimedialne są oparte na narzędziach: agent decyduje, kiedy ich użyć na podstawie
rozmowy, a każde narzędzie pojawia się tylko wtedy, gdy skonfigurowano co najmniej jednego
dostawcę zaplecza.

## Możliwości

<CardGroup cols={2}>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Twórz i edytuj obrazy z promptów tekstowych lub obrazów referencyjnych przez
    `image_generate`. Synchroniczne — kończy się w treści odpowiedzi.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Tekst-na-wideo, obraz-na-wideo i wideo-na-wideo przez `video_generate`.
    Asynchroniczne — działa w tle i publikuje wynik, gdy będzie gotowy.
  </Card>
  <Card title="Generowanie muzyki" href="/pl/tools/music-generation" icon="music">
    Generuj muzykę lub ścieżki audio przez `music_generate`. Asynchroniczne u współdzielonych
    dostawców; ścieżka przepływu pracy ComfyUI działa synchronicznie.
  </Card>
  <Card title="Synteza mowy" href="/pl/tools/tts" icon="microphone">
    Konwertuj wychodzące odpowiedzi na mówione audio za pomocą narzędzia `tts` oraz
    konfiguracji `messages.tts`. Synchroniczne.
  </Card>
  <Card title="Rozumienie multimediów" href="/pl/nodes/media-understanding" icon="eye">
    Streszczaj przychodzące obrazy, audio i wideo za pomocą dostawców modeli
    obsługujących obraz oraz dedykowanych pluginów rozumienia multimediów.
  </Card>
  <Card title="Transkrypcja mowy" href="/pl/nodes/audio" icon="ear-listen">
    Transkrybuj przychodzące wiadomości głosowe przez wsadowe STT lub dostawców
    strumieniowego STT dla Voice Call.
  </Card>
</CardGroup>

## Macierz możliwości dostawców

| Dostawca    | Obraz | Wideo | Muzyka | TTS | STT | Głos w czasie rzeczywistym | Rozumienie multimediów |
| ----------- | :---: | :---: | :----: | :-: | :-: | :------------------------: | :--------------------: |
| Alibaba     |       |   ✓   |        |     |     |                            |                        |
| BytePlus    |       |   ✓   |        |     |     |                            |                        |
| ComfyUI     |   ✓   |   ✓   |   ✓    |     |     |                            |                        |
| DeepInfra   |   ✓   |   ✓   |        |  ✓  |  ✓  |                            |           ✓            |
| Deepgram    |       |       |        |     |  ✓  |             ✓              |                        |
| ElevenLabs  |       |       |        |  ✓  |  ✓  |                            |                        |
| fal         |   ✓   |   ✓   |        |     |     |                            |                        |
| Google      |   ✓   |   ✓   |   ✓    |  ✓  |     |             ✓              |           ✓            |
| Gradium     |       |       |        |  ✓  |     |                            |                        |
| Local CLI   |       |       |        |  ✓  |     |                            |                        |
| Microsoft   |       |       |        |  ✓  |     |                            |                        |
| MiniMax     |   ✓   |   ✓   |   ✓    |  ✓  |     |                            |                        |
| Mistral     |       |       |        |     |  ✓  |                            |                        |
| OpenAI      |   ✓   |   ✓   |        |  ✓  |  ✓  |             ✓              |           ✓            |
| OpenRouter  |   ✓   |   ✓   |        |  ✓  |     |                            |           ✓            |
| Qwen        |       |   ✓   |        |     |     |                            |                        |
| Runway      |       |   ✓   |        |     |     |                            |                        |
| SenseAudio  |       |       |        |     |  ✓  |                            |                        |
| Together    |       |   ✓   |        |     |     |                            |                        |
| Vydra       |   ✓   |   ✓   |        |  ✓  |     |                            |                        |
| xAI         |   ✓   |   ✓   |        |  ✓  |  ✓  |                            |           ✓            |
| Xiaomi MiMo |   ✓   |       |        |  ✓  |     |                            |           ✓            |

<Note>
Rozumienie multimediów używa dowolnego modelu obsługującego obraz lub audio, zarejestrowanego
w konfiguracji dostawcy. Powyższa macierz wymienia dostawców z dedykowaną
obsługą rozumienia multimediów; większość multimodalnych dostawców LLM (Anthropic, Google,
OpenAI itd.) także potrafi rozumieć przychodzące multimedia, gdy są skonfigurowani jako aktywny
model odpowiedzi.
</Note>

## Asynchroniczne a synchroniczne

| Możliwość       | Tryb           | Dlaczego                                                          |
| --------------- | -------------- | ----------------------------------------------------------------- |
| Obraz           | Synchroniczny  | Odpowiedzi dostawców wracają w kilka sekund; kończy się w treści odpowiedzi. |
| Synteza mowy    | Synchroniczny  | Odpowiedzi dostawców wracają w kilka sekund; są dołączane do audio odpowiedzi. |
| Wideo           | Asynchroniczny | Przetwarzanie u dostawcy trwa od 30 s do kilku minut.             |
| Muzyka (współdzielona) | Asynchroniczny | Taka sama charakterystyka przetwarzania u dostawcy jak wideo.                  |
| Muzyka (ComfyUI) | Synchroniczny | Lokalny przepływ pracy działa w treści odpowiedzi wobec skonfigurowanego serwera ComfyUI.  |

W przypadku narzędzi asynchronicznych OpenClaw wysyła żądanie do dostawcy, natychmiast zwraca
identyfikator zadania i śledzi zadanie w rejestrze zadań. Agent nadal
odpowiada na inne wiadomości, gdy zadanie działa. Gdy dostawca zakończy pracę,
OpenClaw wybudza agenta, aby mógł opublikować gotowe multimedia z powrotem w
oryginalnym kanale.

## Transkrypcja mowy i Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio i xAI mogą transkrybować
przychodzące audio przez ścieżkę wsadową `tools.media.audio`, gdy są skonfigurowani.
Pluginy kanałów, które wstępnie sprawdzają notatkę głosową pod kątem bramkowania wzmianek lub
parsowania poleceń, oznaczają transkrybowany załącznik w kontekście przychodzącym, dzięki czemu współdzielony
przebieg rozumienia multimediów ponownie używa tej transkrypcji zamiast wykonywać drugie
wywołanie STT dla tego samego audio.

Deepgram, ElevenLabs, Mistral, OpenAI i xAI rejestrują także dostawców
strumieniowego STT dla Voice Call, dzięki czemu audio z telefonu na żywo może być przekazywane do wybranego
dostawcy bez czekania na ukończenie nagrania.

## Mapowania dostawców (jak dostawcy dzielą się między powierzchniami)

<AccordionGroup>
  <Accordion title="Google">
    Obraz, wideo, muzyka, wsadowe TTS, zapleczowy głos w czasie rzeczywistym oraz
    powierzchnie rozumienia multimediów.
  </Accordion>
  <Accordion title="OpenAI">
    Obraz, wideo, wsadowe TTS, wsadowe STT, strumieniowe STT dla Voice Call, zapleczowy
    głos w czasie rzeczywistym oraz powierzchnie osadzania pamięci.
  </Accordion>
  <Accordion title="DeepInfra">
    Routing czatu/modeli, generowanie/edycja obrazów, tekst-na-wideo, wsadowe TTS,
    wsadowe STT, rozumienie multimediów obrazowych oraz powierzchnie osadzania pamięci.
    Natywne dla DeepInfra modele ponownego rankingu/klasyfikacji/wykrywania obiektów nie są
    rejestrowane, dopóki OpenClaw nie ma dedykowanych kontraktów dostawcy dla tych
    kategorii.
  </Accordion>
  <Accordion title="xAI">
    Obraz, wideo, wyszukiwanie, wykonywanie kodu, wsadowe TTS, wsadowe STT oraz strumieniowe STT dla Voice
    Call. Głos xAI Realtime jest możliwością upstreamową, ale nie jest
    rejestrowany w OpenClaw, dopóki współdzielony kontrakt głosu w czasie rzeczywistym nie będzie mógł
    go reprezentować.
  </Accordion>
</AccordionGroup>

## Powiązane

- [Generowanie obrazów](/pl/tools/image-generation)
- [Generowanie wideo](/pl/tools/video-generation)
- [Generowanie muzyki](/pl/tools/music-generation)
- [Synteza mowy](/pl/tools/tts)
- [Rozumienie multimediów](/pl/nodes/media-understanding)
- [Węzły audio](/pl/nodes/audio)
