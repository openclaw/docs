---
read_when:
    - Szukasz omówienia możliwości multimedialnych OpenClaw
    - Wybór dostawcy multimediów do skonfigurowania
    - Zrozumienie sposobu działania asynchronicznego generowania multimediów
sidebarTitle: Media overview
summary: Możliwości obrazu, wideo, muzyki, mowy i rozumienia mediów w skrócie
title: Omówienie mediów
x-i18n:
    generated_at: "2026-06-27T18:28:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c04beb60abbd06d1503302be144e633b526ae55435f061fbb94f6fef85ca9d66
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw generuje obrazy, filmy i muzykę, rozumie przychodzące multimedia
(obrazy, audio, wideo) i odczytuje odpowiedzi na głos za pomocą zamiany tekstu
na mowę. Wszystkie możliwości multimedialne są obsługiwane przez narzędzia:
agent decyduje, kiedy ich użyć na podstawie rozmowy, a każde narzędzie pojawia
się tylko wtedy, gdy skonfigurowano co najmniej jednego wspierającego je
dostawcę.

Mowa na żywo używa kontraktu sesji Talk zamiast ścieżki jednorazowego narzędzia
multimedialnego. Talk ma trzy tryby: natywny dla dostawcy `realtime`, lokalny
lub strumieniowy `stt-tts` oraz `transcription` do przechwytywania mowy tylko
w trybie obserwacji. Te tryby współdzielą katalogi dostawców, koperty zdarzeń
i semantykę anulowania z telefonią, spotkaniami, trybem czasu rzeczywistego
w przeglądarce oraz natywnymi klientami push-to-talk.

## Możliwości

<CardGroup cols={2}>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Twórz i edytuj obrazy na podstawie promptów tekstowych lub obrazów
    referencyjnych przez `image_generate`. Asynchroniczne w sesjach czatu —
    działa w tle i publikuje wynik, gdy będzie gotowy.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Tekst-na-wideo, obraz-na-wideo i wideo-na-wideo przez `video_generate`.
    Asynchroniczne — działa w tle i publikuje wynik, gdy będzie gotowy.
  </Card>
  <Card title="Generowanie muzyki" href="/pl/tools/music-generation" icon="music">
    Generuj muzykę lub ścieżki audio przez `music_generate`. Asynchroniczne
    w sesjach czatu we współdzielonym cyklu życia zadań generowania multimediów.
  </Card>
  <Card title="Tekst na mowę" href="/pl/tools/tts" icon="microphone">
    Konwertuj wychodzące odpowiedzi na mówione audio za pomocą narzędzia `tts`
    oraz konfiguracji `messages.tts`. Synchroniczne.
  </Card>
  <Card title="Rozumienie multimediów" href="/pl/nodes/media-understanding" icon="eye">
    Streszczaj przychodzące obrazy, audio i wideo za pomocą dostawców modeli
    obsługujących wizję oraz dedykowanych pluginów rozumienia multimediów.
  </Card>
  <Card title="Mowa na tekst" href="/pl/nodes/audio" icon="ear-listen">
    Transkrybuj przychodzące wiadomości głosowe przez wsadowych dostawców STT
    albo strumieniowych dostawców STT Voice Call.
  </Card>
</CardGroup>

## Macierz możliwości dostawców

| Dostawca          | Obraz | Wideo | Muzyka | TTS | STT | Głos w czasie rzeczywistym | Rozumienie multimediów |
| ----------------- | :---: | :---: | :----: | :-: | :-: | :------------------------: | :--------------------: |
| Alibaba           |       |   ✓   |        |     |     |                            |                        |
| BytePlus          |       |   ✓   |        |     |     |                            |                        |
| ComfyUI           |   ✓   |   ✓   |   ✓    |     |     |                            |                        |
| DeepInfra         |   ✓   |   ✓   |        |  ✓  |  ✓  |                            |           ✓            |
| Deepgram          |       |       |        |     |  ✓  |             ✓              |                        |
| ElevenLabs        |       |       |        |  ✓  |  ✓  |                            |                        |
| fal               |   ✓   |   ✓   |   ✓    |     |     |                            |                        |
| Google            |   ✓   |   ✓   |   ✓    |  ✓  |     |             ✓              |           ✓            |
| Gradium           |       |       |        |  ✓  |     |                            |                        |
| Local CLI         |       |       |        |  ✓  |     |                            |                        |
| Microsoft         |       |       |        |  ✓  |     |                            |                        |
| Microsoft Foundry |   ✓   |       |        |     |     |                            |                        |
| MiniMax           |   ✓   |   ✓   |   ✓    |  ✓  |     |                            |                        |
| Mistral           |       |       |        |     |  ✓  |                            |                        |
| OpenAI            |   ✓   |   ✓   |        |  ✓  |  ✓  |             ✓              |           ✓            |
| OpenRouter        |   ✓   |   ✓   |   ✓    |  ✓  |  ✓  |                            |           ✓            |
| Qwen              |       |   ✓   |        |     |     |                            |                        |
| Runway            |       |   ✓   |        |     |     |                            |                        |
| SenseAudio        |       |       |        |     |  ✓  |                            |                        |
| Together          |       |   ✓   |        |     |     |                            |                        |
| Vydra             |   ✓   |   ✓   |        |  ✓  |     |                            |                        |
| xAI               |   ✓   |   ✓   |        |  ✓  |  ✓  |                            |           ✓            |
| Xiaomi MiMo       |   ✓   |       |        |  ✓  |     |                            |           ✓            |

<Note>
Rozumienie multimediów używa dowolnego modelu obsługującego wizję lub audio
zarejestrowanego w konfiguracji dostawcy. Powyższa macierz wymienia dostawców
z dedykowaną obsługą rozumienia multimediów; większość dostawców multimodalnych
LLM (Anthropic, Google, OpenAI itd.) może również rozumieć przychodzące
multimedia, gdy są skonfigurowani jako aktywny model odpowiedzi.
</Note>

## Asynchroniczne a synchroniczne

| Możliwość     | Tryb             | Dlaczego                                                                                                  |
| ------------- | ---------------- | --------------------------------------------------------------------------------------------------------- |
| Obraz         | Asynchroniczne   | Przetwarzanie u dostawcy może trwać dłużej niż tura czatu; wygenerowane załączniki używają współdzielonej ścieżki ukończenia. |
| Tekst na mowę | Synchroniczne    | Odpowiedzi dostawcy wracają w kilka sekund; są dołączane do audio odpowiedzi.                             |
| Wideo         | Asynchroniczne   | Przetwarzanie u dostawcy trwa od 30 s do kilku minut; wolne kolejki mogą działać aż do skonfigurowanego limitu czasu. |
| Muzyka        | Asynchroniczne   | Taka sama charakterystyka przetwarzania u dostawcy jak w przypadku wideo.                                 |

W przypadku narzędzi asynchronicznych OpenClaw wysyła żądanie do dostawcy,
natychmiast zwraca identyfikator zadania i śledzi pracę w rejestrze zadań.
Agent nadal odpowiada na inne wiadomości, gdy zadanie działa. Gdy dostawca
zakończy pracę, OpenClaw budzi agenta ze ścieżkami wygenerowanych multimediów,
aby mógł poinformować użytkownika przez normalny widoczny tryb odpowiedzi
sesji: automatyczne dostarczenie końcowej odpowiedzi, gdy jest skonfigurowane,
albo `message(action="send")`, gdy sesja wymaga narzędzia wiadomości. Jeśli
sesja żądająca jest nieaktywna albo jej aktywne wybudzenie się nie powiedzie,
a w odpowiedzi ukończenia nadal brakuje części wygenerowanych multimediów,
OpenClaw wysyła idempotentne bezpośrednie rozwiązanie awaryjne zawierające
tylko brakujące multimedia. Multimedia już dostarczone przez odpowiedź
ukończenia nie są publikowane ponownie.

## Mowa na tekst i Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, OpenRouter, SenseAudio i xAI mogą transkrybować
przychodzące audio przez wsadową ścieżkę `tools.media.audio`, gdy są
skonfigurowane. Pluginy kanałów, które wstępnie sprawdzają notatkę głosową
pod kątem bramkowania wzmianki lub parsowania poleceń, oznaczają
przetranskrybowany załącznik w kontekście przychodzącym, więc współdzielony
przebieg rozumienia multimediów używa ponownie tej transkrypcji zamiast
wykonywać drugie wywołanie STT dla tego samego audio.

Deepgram, ElevenLabs, Mistral, OpenAI i xAI rejestrują też strumieniowych
dostawców STT Voice Call, więc audio z rozmowy telefonicznej na żywo może być
przekazywane do wybranego dostawcy bez oczekiwania na ukończone nagranie.

W przypadku rozmów z użytkownikiem na żywo preferuj [tryb Talk](/pl/nodes/talk).
Wsadowe załączniki audio pozostają na ścieżce multimediów; tryb czasu
rzeczywistego w przeglądarce, natywny push-to-talk, telefonia i audio spotkań
powinny używać zdarzeń Talk oraz katalogów o zakresie sesji zwracanych przez
Gateway.

## Mapowania dostawców (jak dostawcy dzielą się między powierzchniami)

<AccordionGroup>
  <Accordion title="Google">
    Powierzchnie obrazów, wideo, muzyki, wsadowego TTS, backendowego głosu
    w czasie rzeczywistym oraz rozumienia multimediów.
  </Accordion>
  <Accordion title="OpenAI">
    Powierzchnie obrazów, wideo, wsadowego TTS, wsadowego STT, strumieniowego
    STT Voice Call, backendowego głosu w czasie rzeczywistym oraz osadzania
    pamięci.
  </Accordion>
  <Accordion title="DeepInfra">
    Powierzchnie routingu czatu/modelu, generowania/edycji obrazów,
    tekst-na-wideo, wsadowego TTS, wsadowego STT, rozumienia multimediów
    obrazowych oraz osadzania pamięci. Natywne dla DeepInfra modele
    ponownego rankingu/klasyfikacji/wykrywania obiektów nie są rejestrowane,
    dopóki OpenClaw nie będzie mieć dedykowanych kontraktów dostawców dla
    tych kategorii.
  </Accordion>
  <Accordion title="xAI">
    Obrazy, wideo, wyszukiwanie, wykonywanie kodu, wsadowe TTS, wsadowe STT
    oraz strumieniowe STT Voice Call. Głos xAI Realtime jest możliwością
    upstreamową, ale nie jest rejestrowany w OpenClaw, dopóki współdzielony
    kontrakt głosu w czasie rzeczywistym nie będzie mógł go reprezentować.
  </Accordion>
</AccordionGroup>

## Powiązane

- [Generowanie obrazów](/pl/tools/image-generation)
- [Generowanie wideo](/pl/tools/video-generation)
- [Generowanie muzyki](/pl/tools/music-generation)
- [Tekst na mowę](/pl/tools/tts)
- [Rozumienie multimediów](/pl/nodes/media-understanding)
- [Węzły audio](/pl/nodes/audio)
- [Tryb Talk](/pl/nodes/talk)
