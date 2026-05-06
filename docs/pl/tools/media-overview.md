---
read_when:
    - Szukasz przeglądu możliwości multimedialnych OpenClaw
    - Wybór dostawcy mediów do skonfigurowania
    - Jak działa asynchroniczne generowanie multimediów
sidebarTitle: Media overview
summary: Przegląd możliwości dotyczących obrazów, wideo, muzyki, mowy i rozumienia mediów
title: Omówienie multimediów
x-i18n:
    generated_at: "2026-05-06T09:34:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 201d01244fc6a587b730ae3033de5990b2f01f63e6e40339c738c95040e085b3
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw generuje obrazy, filmy i muzykę, rozumie przychodzące multimedia
(obrazy, audio, wideo) oraz wypowiada odpowiedzi na głos za pomocą zamiany
tekstu na mowę. Wszystkie funkcje multimedialne są obsługiwane przez narzędzia:
agent decyduje, kiedy ich użyć, na podstawie rozmowy, a każde narzędzie pojawia
się tylko wtedy, gdy skonfigurowano co najmniej jednego wspierającego je
dostawcę.

Mowa na żywo używa kontraktu sesji Talk zamiast ścieżki jednorazowego narzędzia
multimedialnego. Talk ma trzy tryby: natywny dla dostawcy `realtime`, lokalny
lub strumieniowy `stt-tts` oraz `transcription` do przechwytywania mowy tylko do
obserwacji. Te tryby współdzielą katalogi dostawców, koperty zdarzeń i semantykę
anulowania z telefonią, spotkaniami, przeglądarkowym trybem czasu rzeczywistego
oraz natywnymi klientami push-to-talk.

## Możliwości

<CardGroup cols={2}>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Twórz i edytuj obrazy z promptów tekstowych lub obrazów referencyjnych za
    pomocą `image_generate`. Synchroniczne — kończy się w treści odpowiedzi.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Tekst-na-wideo, obraz-na-wideo i wideo-na-wideo za pomocą `video_generate`.
    Asynchroniczne — działa w tle i publikuje wynik, gdy będzie gotowy.
  </Card>
  <Card title="Generowanie muzyki" href="/pl/tools/music-generation" icon="music">
    Generuj muzykę lub ścieżki audio za pomocą `music_generate`. Asynchroniczne
    u współdzielonych dostawców; ścieżka przepływu pracy ComfyUI działa synchronicznie.
  </Card>
  <Card title="Zamiana tekstu na mowę" href="/pl/tools/tts" icon="microphone">
    Konwertuj wychodzące odpowiedzi na mówione audio za pomocą narzędzia `tts`
    oraz konfiguracji `messages.tts`. Synchroniczne.
  </Card>
  <Card title="Rozumienie multimediów" href="/pl/nodes/media-understanding" icon="eye">
    Podsumowuj przychodzące obrazy, audio i wideo za pomocą dostawców modeli
    obsługujących widzenie oraz dedykowanych pluginów rozumienia multimediów.
  </Card>
  <Card title="Zamiana mowy na tekst" href="/pl/nodes/audio" icon="ear-listen">
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
Rozumienie multimediów używa dowolnego modelu obsługującego widzenie lub audio,
zarejestrowanego w konfiguracji dostawcy. Powyższa macierz wymienia dostawców
z dedykowaną obsługą rozumienia multimediów; większość multimodalnych dostawców
LLM (Anthropic, Google, OpenAI itd.) może również rozumieć przychodzące
multimedia, gdy są skonfigurowani jako aktywny model odpowiedzi.
</Note>

## Asynchroniczne a synchroniczne

| Możliwość       | Tryb             | Dlaczego                                                                                               |
| --------------- | ---------------- | ------------------------------------------------------------------------------------------------------ |
| Obraz           | Synchroniczny    | Odpowiedzi dostawcy wracają w kilka sekund; kończy się w treści odpowiedzi.                            |
| Tekst-na-mowę   | Synchroniczny    | Odpowiedzi dostawcy wracają w kilka sekund; dołączane do audio odpowiedzi.                             |
| Wideo           | Asynchroniczny   | Przetwarzanie u dostawcy trwa od 30 s do kilku minut; wolne kolejki mogą działać do skonfigurowanego limitu czasu. |
| Muzyka (wspólna)  | Asynchroniczny   | Taka sama charakterystyka przetwarzania u dostawcy jak w przypadku wideo.                              |
| Muzyka (ComfyUI) | Synchroniczny    | Lokalny przepływ pracy działa w treści odpowiedzi wobec skonfigurowanego serwera ComfyUI.              |

W przypadku narzędzi asynchronicznych OpenClaw przesyła żądanie do dostawcy,
natychmiast zwraca identyfikator zadania i śledzi pracę w rejestrze zadań.
Agent nadal odpowiada na inne wiadomości, gdy zadanie działa. Gdy dostawca
zakończy pracę, OpenClaw wybudza agenta ze ścieżkami wygenerowanych multimediów,
aby mógł powiadomić użytkownika i, gdy wymaga tego polityka dostarczania źródła,
przekazać wynik przez narzędzie wiadomości. W przypadku tras grup/kanałów
obsługiwanych wyłącznie przez narzędzie wiadomości OpenClaw traktuje brak
dowodu dostarczenia przez narzędzie wiadomości jako nieudaną próbę ukończenia
i wysyła zapasowe wygenerowane multimedia bezpośrednio do pierwotnego kanału.

## Zamiana mowy na tekst i Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio i xAI mogą transkrybować
przychodzące audio przez wsadową ścieżkę `tools.media.audio`, gdy są skonfigurowane.
Pluginy kanałów, które wstępnie sprawdzają notatkę głosową pod kątem bramkowania
wzmianek lub parsowania poleceń, oznaczają transkrybowany załącznik w kontekście
przychodzącym, dzięki czemu współdzielony przebieg rozumienia multimediów używa
tej transkrypcji ponownie zamiast wykonywać drugie wywołanie STT dla tego samego
audio.

Deepgram, ElevenLabs, Mistral, OpenAI i xAI rejestrują również dostawców
strumieniowego STT dla Voice Call, dzięki czemu audio z rozmowy telefonicznej
na żywo może być przekazywane do wybranego dostawcy bez czekania na zakończone
nagranie.

W rozmowach użytkowników na żywo preferuj [tryb Talk](/pl/nodes/talk). Wsadowe
załączniki audio pozostają na ścieżce multimediów; przeglądarkowy tryb czasu
rzeczywistego, natywne push-to-talk, telefonia i audio ze spotkań powinny używać
zdarzeń Talk oraz katalogów ograniczonych do sesji zwracanych przez Gateway.

## Mapowania dostawców (jak dostawcy dzielą się na powierzchnie)

<AccordionGroup>
  <Accordion title="Google">
    Obraz, wideo, muzyka, wsadowe TTS, głos backendu w czasie rzeczywistym oraz
    powierzchnie rozumienia multimediów.
  </Accordion>
  <Accordion title="OpenAI">
    Obraz, wideo, wsadowe TTS, wsadowe STT, strumieniowe STT dla Voice Call,
    głos backendu w czasie rzeczywistym oraz powierzchnie embeddingów pamięci.
  </Accordion>
  <Accordion title="DeepInfra">
    Routing czatu/modeli, generowanie/edycja obrazów, tekst-na-wideo, wsadowe TTS,
    wsadowe STT, rozumienie multimediów obrazów oraz powierzchnie embeddingów pamięci.
    Modele rerankingu/klasyfikacji/wykrywania obiektów natywne dla DeepInfra nie są
    rejestrowane, dopóki OpenClaw nie będzie mieć dedykowanych kontraktów dostawców
    dla tych kategorii.
  </Accordion>
  <Accordion title="xAI">
    Obraz, wideo, wyszukiwanie, wykonywanie kodu, wsadowe TTS, wsadowe STT oraz
    strumieniowe STT dla Voice Call. Głos xAI Realtime jest funkcją upstream,
    ale nie jest rejestrowany w OpenClaw, dopóki współdzielony kontrakt głosu
    w czasie rzeczywistym nie będzie mógł go reprezentować.
  </Accordion>
</AccordionGroup>

## Powiązane

- [Generowanie obrazów](/pl/tools/image-generation)
- [Generowanie wideo](/pl/tools/video-generation)
- [Generowanie muzyki](/pl/tools/music-generation)
- [Zamiana tekstu na mowę](/pl/tools/tts)
- [Rozumienie multimediów](/pl/nodes/media-understanding)
- [Węzły audio](/pl/nodes/audio)
- [Tryb Talk](/pl/nodes/talk)
