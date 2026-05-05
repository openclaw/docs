---
read_when:
    - Szukasz omówienia możliwości multimedialnych OpenClaw
    - Wybór dostawcy mediów do skonfigurowania
    - Zrozumienie, jak działa asynchroniczne generowanie multimediów
sidebarTitle: Media overview
summary: Możliwości dotyczące obrazów, wideo, muzyki, mowy i rozumienia mediów w skrócie
title: Przegląd mediów
x-i18n:
    generated_at: "2026-05-05T06:19:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd02d4418fe294fda5f1437dd3a07c4aeb4de3b46a1b70bfe36914bc27123cc4
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw generuje obrazy, filmy i muzykę, rozumie przychodzące media
(obrazy, dźwięk, wideo) i wypowiada odpowiedzi na głos za pomocą syntezy mowy. Wszystkie
funkcje mediów są sterowane narzędziami: agent decyduje, kiedy ich użyć, na podstawie
rozmowy, a każde narzędzie pojawia się tylko wtedy, gdy skonfigurowano co najmniej jednego
dostawcę zaplecza.

## Możliwości

<CardGroup cols={2}>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Twórz i edytuj obrazy na podstawie promptów tekstowych lub obrazów referencyjnych za pomocą
    `image_generate`. Synchronicznie — kończy się w ramach odpowiedzi.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Tekst-na-wideo, obraz-na-wideo i wideo-na-wideo za pomocą `video_generate`.
    Asynchronicznie — działa w tle i publikuje wynik, gdy będzie gotowy.
  </Card>
  <Card title="Generowanie muzyki" href="/pl/tools/music-generation" icon="music">
    Generuj muzykę lub ścieżki audio za pomocą `music_generate`. Asynchronicznie u współdzielonych
    dostawców; ścieżka przepływu pracy ComfyUI działa synchronicznie.
  </Card>
  <Card title="Tekst na mowę" href="/pl/tools/tts" icon="microphone">
    Konwertuj wychodzące odpowiedzi na mówione audio za pomocą narzędzia `tts` oraz
    konfiguracji `messages.tts`. Synchronicznie.
  </Card>
  <Card title="Rozumienie mediów" href="/pl/nodes/media-understanding" icon="eye">
    Streszczaj przychodzące obrazy, dźwięk i wideo przy użyciu dostawców modeli
    obsługujących wizję oraz dedykowanych pluginów do rozumienia mediów.
  </Card>
  <Card title="Mowa na tekst" href="/pl/nodes/audio" icon="ear-listen">
    Transkrybuj przychodzące wiadomości głosowe przez wsadowe STT lub dostawców
    strumieniowego STT dla Voice Call.
  </Card>
</CardGroup>

## Macierz możliwości dostawców

| Dostawca    | Obraz | Wideo | Muzyka | TTS | STT | Głos w czasie rzeczywistym | Rozumienie mediów |
| ----------- | :---: | :---: | :----: | :-: | :-: | :------------------------: | :---------------: |
| Alibaba     |       |   ✓   |        |     |     |                            |                   |
| BytePlus    |       |   ✓   |        |     |     |                            |                   |
| ComfyUI     |   ✓   |   ✓   |   ✓    |     |     |                            |                   |
| DeepInfra   |   ✓   |   ✓   |        |  ✓  |  ✓  |                            |         ✓         |
| Deepgram    |       |       |        |     |  ✓  |             ✓              |                   |
| ElevenLabs  |       |       |        |  ✓  |  ✓  |                            |                   |
| fal         |   ✓   |   ✓   |        |     |     |                            |                   |
| Google      |   ✓   |   ✓   |   ✓    |  ✓  |     |             ✓              |         ✓         |
| Gradium     |       |       |        |  ✓  |     |                            |                   |
| Local CLI   |       |       |        |  ✓  |     |                            |                   |
| Microsoft   |       |       |        |  ✓  |     |                            |                   |
| MiniMax     |   ✓   |   ✓   |   ✓    |  ✓  |     |                            |                   |
| Mistral     |       |       |        |     |  ✓  |                            |                   |
| OpenAI      |   ✓   |   ✓   |        |  ✓  |  ✓  |             ✓              |         ✓         |
| OpenRouter  |   ✓   |   ✓   |        |  ✓  |     |                            |         ✓         |
| Qwen        |       |   ✓   |        |     |     |                            |                   |
| Runway      |       |   ✓   |        |     |     |                            |                   |
| SenseAudio  |       |       |        |     |  ✓  |                            |                   |
| Together    |       |   ✓   |        |     |     |                            |                   |
| Vydra       |   ✓   |   ✓   |        |  ✓  |     |                            |                   |
| xAI         |   ✓   |   ✓   |        |  ✓  |  ✓  |                            |         ✓         |
| Xiaomi MiMo |   ✓   |       |        |  ✓  |     |                            |         ✓         |

<Note>
Rozumienie mediów używa dowolnego modelu obsługującego wizję lub audio, zarejestrowanego
w konfiguracji dostawcy. Powyższa macierz wymienia dostawców z dedykowaną
obsługą rozumienia mediów; większość multimodalnych dostawców LLM (Anthropic, Google,
OpenAI itd.) może także rozumieć przychodzące media, gdy jest skonfigurowana jako aktywny
model odpowiedzi.
</Note>

## Tryb asynchroniczny i synchroniczny

| Możliwość       | Tryb            | Dlaczego                                                                                            |
| --------------- | --------------- | --------------------------------------------------------------------------------------------------- |
| Obraz           | Synchroniczny   | Odpowiedzi dostawcy wracają w kilka sekund; kończy się w ramach odpowiedzi.                         |
| Tekst na mowę   | Synchroniczny   | Odpowiedzi dostawcy wracają w kilka sekund; są dołączane do audio odpowiedzi.                       |
| Wideo           | Asynchroniczny  | Przetwarzanie u dostawcy trwa od 30 s do kilku minut; wolne kolejki mogą działać do skonfigurowanego limitu czasu. |
| Muzyka (współdzielona) | Asynchroniczny | Ta sama charakterystyka przetwarzania u dostawcy co w przypadku wideo.                              |
| Muzyka (ComfyUI) | Synchroniczny  | Lokalny przepływ pracy działa w ramach odpowiedzi względem skonfigurowanego serwera ComfyUI.        |

W przypadku narzędzi asynchronicznych OpenClaw przesyła żądanie do dostawcy, natychmiast zwraca
identyfikator zadania i śledzi zadanie w rejestrze zadań. Agent kontynuuje
odpowiadanie na inne wiadomości, gdy zadanie działa. Gdy dostawca zakończy pracę,
OpenClaw wybudza agenta ze ścieżkami wygenerowanych mediów, aby mógł poinformować
użytkownika i, gdy wymaga tego polityka dostarczania źródłowego, przekazać wynik przez
narzędzie wiadomości. W przypadku tras grup/kanałów obsługiwanych wyłącznie przez narzędzie wiadomości OpenClaw traktuje
brak dowodu dostarczenia przez narzędzie wiadomości jako nieudaną próbę ukończenia i wysyła
wygenerowane media awaryjnie bezpośrednio do pierwotnego kanału.

## Mowa na tekst i Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio i xAI mogą transkrybować
przychodzące audio przez wsadową ścieżkę `tools.media.audio`, gdy są skonfigurowane.
Pluginy kanałów, które wstępnie sprawdzają notatkę głosową pod kątem bramkowania wzmianki lub
parsowania poleceń, oznaczają transkrybowany załącznik w kontekście przychodzącym, dzięki czemu współdzielony
przebieg rozumienia mediów ponownie używa tej transkrypcji zamiast wykonywać drugie
wywołanie STT dla tego samego audio.

Deepgram, ElevenLabs, Mistral, OpenAI i xAI rejestrują także dostawców
strumieniowego STT dla Voice Call, więc dźwięk z rozmowy telefonicznej na żywo można przekazać do wybranego
dostawcy bez czekania na ukończenie nagrania.

## Mapowania dostawców (jak dostawcy dzielą się między powierzchnie)

<AccordionGroup>
  <Accordion title="Google">
    Obraz, wideo, muzyka, wsadowe TTS, głos backendowy w czasie rzeczywistym oraz
    powierzchnie rozumienia mediów.
  </Accordion>
  <Accordion title="OpenAI">
    Obraz, wideo, wsadowe TTS, wsadowe STT, strumieniowe STT Voice Call, backendowy
    głos w czasie rzeczywistym oraz powierzchnie osadzania pamięci.
  </Accordion>
  <Accordion title="DeepInfra">
    Czat/routing modeli, generowanie/edycja obrazów, tekst-na-wideo, wsadowe TTS,
    wsadowe STT, rozumienie mediów obrazowych oraz powierzchnie osadzania pamięci.
    Natywne dla DeepInfra modele rerankingu/klasyfikacji/wykrywania obiektów nie są
    rejestrowane, dopóki OpenClaw nie będzie mieć dedykowanych kontraktów dostawców dla tych
    kategorii.
  </Accordion>
  <Accordion title="xAI">
    Obraz, wideo, wyszukiwanie, wykonywanie kodu, wsadowe TTS, wsadowe STT oraz strumieniowe STT
    Voice Call. Głos xAI Realtime jest możliwością po stronie dostawcy upstream, ale
    nie jest rejestrowany w OpenClaw, dopóki współdzielony kontrakt głosu w czasie rzeczywistym nie będzie mógł
    go reprezentować.
  </Accordion>
</AccordionGroup>

## Powiązane

- [Generowanie obrazów](/pl/tools/image-generation)
- [Generowanie wideo](/pl/tools/video-generation)
- [Generowanie muzyki](/pl/tools/music-generation)
- [Tekst na mowę](/pl/tools/tts)
- [Rozumienie mediów](/pl/nodes/media-understanding)
- [Węzły audio](/pl/nodes/audio)
