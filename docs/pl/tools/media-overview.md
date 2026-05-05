---
read_when:
    - Szukasz przeglądu możliwości multimedialnych OpenClaw
    - Wybór dostawcy mediów do skonfigurowania
    - Zrozumienie, jak działa asynchroniczne generowanie multimediów
sidebarTitle: Media overview
summary: Możliwości dotyczące obrazu, wideo, muzyki, mowy i rozumienia mediów w skrócie
title: Przegląd mediów
x-i18n:
    generated_at: "2026-05-05T01:50:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bd6b93fd79897001d24f3ba5a5c8cb9bd17281116fad17262a6389214db7059
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw generuje obrazy, wideo i muzykę, rozumie przychodzące multimedia
(obrazy, audio, wideo) oraz wypowiada odpowiedzi na głos przy użyciu syntezy mowy. Wszystkie
funkcje multimedialne są obsługiwane przez narzędzia: agent decyduje, kiedy ich użyć na podstawie
rozmowy, a każde narzędzie pojawia się tylko wtedy, gdy skonfigurowano co najmniej jednego
obsługującego je dostawcę.

## Możliwości

<CardGroup cols={2}>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Twórz i edytuj obrazy z promptów tekstowych lub obrazów referencyjnych za pomocą
    `image_generate`. Synchroniczne — kończy się bezpośrednio w odpowiedzi.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Tekst-na-wideo, obraz-na-wideo i wideo-na-wideo za pomocą `video_generate`.
    Asynchroniczne — działa w tle i publikuje wynik, gdy jest gotowy.
  </Card>
  <Card title="Generowanie muzyki" href="/pl/tools/music-generation" icon="music">
    Generuj muzykę lub ścieżki audio za pomocą `music_generate`. Asynchroniczne u współdzielonych
    dostawców; ścieżka przepływu pracy ComfyUI działa synchronicznie.
  </Card>
  <Card title="Synteza mowy" href="/pl/tools/tts" icon="microphone">
    Konwertuj wychodzące odpowiedzi na mówione audio za pomocą narzędzia `tts` oraz
    konfiguracji `messages.tts`. Synchroniczne.
  </Card>
  <Card title="Rozumienie multimediów" href="/pl/nodes/media-understanding" icon="eye">
    Streszczaj przychodzące obrazy, audio i wideo przy użyciu dostawców modeli
    obsługujących widzenie oraz dedykowanych Pluginów do rozumienia multimediów.
  </Card>
  <Card title="Transkrypcja mowy" href="/pl/nodes/audio" icon="ear-listen">
    Transkrybuj przychodzące wiadomości głosowe przez dostawców wsadowego STT lub strumieniowego STT
    dla połączeń głosowych.
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
Rozumienie multimediów używa dowolnego modelu obsługującego widzenie lub audio zarejestrowanego
w konfiguracji dostawcy. Powyższa macierz wymienia dostawców z dedykowaną
obsługą rozumienia multimediów; większość dostawców multimodalnych LLM (Anthropic, Google,
OpenAI itd.) również może rozumieć przychodzące multimedia, gdy jest skonfigurowana jako aktywny
model odpowiedzi.
</Note>

## Asynchroniczne a synchroniczne

| Możliwość       | Tryb          | Dlaczego                                                          |
| --------------- | ------------- | ----------------------------------------------------------------- |
| Obraz           | Synchroniczny | Odpowiedzi dostawcy wracają w kilka sekund; kończy się w odpowiedzi. |
| Synteza mowy    | Synchroniczny | Odpowiedzi dostawcy wracają w kilka sekund; dołączane do audio odpowiedzi. |
| Wideo           | Asynchroniczny | Przetwarzanie u dostawcy trwa od 30 s do kilku minut.             |
| Muzyka (współdzielona) | Asynchroniczny | Taka sama charakterystyka przetwarzania u dostawcy jak wideo. |
| Muzyka (ComfyUI) | Synchroniczny | Lokalny przepływ pracy działa bezpośrednio na skonfigurowanym serwerze ComfyUI. |

W przypadku narzędzi asynchronicznych OpenClaw wysyła żądanie do dostawcy, natychmiast zwraca
identyfikator zadania i śledzi pracę w rejestrze zadań. Agent nadal
odpowiada na inne wiadomości, gdy zadanie działa. Gdy dostawca zakończy pracę,
OpenClaw wybudza agenta z wygenerowanymi ścieżkami multimediów, aby mógł poinformować
użytkownika i, gdy wymaga tego polityka dostarczania ze źródła, przekazać wynik przez
narzędzie wiadomości.

## Transkrypcja mowy i połączenie głosowe

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio i xAI mogą transkrybować
przychodzące audio przez wsadową ścieżkę `tools.media.audio`, gdy są skonfigurowane.
Pluginy kanałów, które wstępnie sprawdzają notatkę głosową pod kątem bramkowania wzmianek lub
parsowania poleceń, oznaczają transkrybowany załącznik w kontekście przychodzącym, więc współdzielony
przebieg rozumienia multimediów używa ponownie tej transkrypcji zamiast wykonywać drugie
wywołanie STT dla tego samego audio.

Deepgram, ElevenLabs, Mistral, OpenAI i xAI rejestrują również dostawców strumieniowego STT
dla połączeń głosowych, więc audio z rozmowy na żywo może być przekazywane do wybranego
dostawcy bez czekania na zakończone nagranie.

## Mapowania dostawców (jak dostawcy dzielą się na powierzchnie)

<AccordionGroup>
  <Accordion title="Google">
    Powierzchnie obrazu, wideo, muzyki, wsadowego TTS, głosu backendu w czasie rzeczywistym oraz
    rozumienia multimediów.
  </Accordion>
  <Accordion title="OpenAI">
    Powierzchnie obrazu, wideo, wsadowego TTS, wsadowego STT, strumieniowego STT dla połączeń głosowych, głosu backendu
    w czasie rzeczywistym oraz osadzania pamięci.
  </Accordion>
  <Accordion title="DeepInfra">
    Powierzchnie routingu czatu/modelu, generowania/edycji obrazów, tekst-na-wideo, wsadowego TTS,
    wsadowego STT, rozumienia multimediów obrazów oraz osadzania pamięci.
    Natywne dla DeepInfra modele ponownego rankingowania/klasyfikacji/wykrywania obiektów nie są
    rejestrowane, dopóki OpenClaw nie ma dedykowanych kontraktów dostawców dla tych
    kategorii.
  </Accordion>
  <Accordion title="xAI">
    Obraz, wideo, wyszukiwanie, wykonywanie kodu, wsadowe TTS, wsadowe STT oraz strumieniowe STT dla połączeń
    głosowych. Głos xAI Realtime jest funkcją upstream, ale nie jest
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
