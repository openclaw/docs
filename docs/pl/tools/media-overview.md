---
read_when:
    - Szukasz przeglądu możliwości OpenClaw w zakresie multimediów
    - Wybór dostawcy multimediów do skonfigurowania
    - Jak działa asynchroniczne generowanie multimediów
sidebarTitle: Media overview
summary: Przegląd możliwości generowania obrazów, wideo, muzyki i mowy oraz rozumienia multimediów
title: Omówienie multimediów
x-i18n:
    generated_at: "2026-07-12T15:43:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f7d7bf8bd2052cdba088d7a612bb89b0fc3a95b3635c7fcd2138eb731121b85f
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw generuje obrazy, filmy i muzykę, rozumie przychodzące multimedia
(obrazy, dźwięk i filmy) oraz odczytuje odpowiedzi na głos za pomocą syntezy mowy. Wszystkie
funkcje multimedialne są obsługiwane przez narzędzia: agent decyduje na podstawie
rozmowy, kiedy ich użyć, a każde narzędzie pojawia się tylko wtedy, gdy skonfigurowano
co najmniej jednego obsługującego je dostawcę.

Mowa na żywo korzysta z kontraktu sesji Talk zamiast ścieżki jednorazowego narzędzia
multimedialnego. Talk ma trzy tryby: natywny dla dostawcy `realtime`, lokalny lub strumieniowy
`stt-tts` oraz `transcription` do przechwytywania mowy wyłącznie w celu obserwacji. Tryby te
współdzielą katalogi dostawców, koperty zdarzeń i semantykę anulowania z
telefonią, spotkaniami, komunikacją w czasie rzeczywistym w przeglądarce oraz natywnymi klientami „naciśnij, aby mówić”.

## Możliwości

<CardGroup cols={2}>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Twórz i edytuj obrazy na podstawie poleceń tekstowych lub obrazów referencyjnych za pomocą
    `image_generate`. Asynchroniczne w sesjach czatu — działa w tle i
    publikuje wynik, gdy jest gotowy.
  </Card>
  <Card title="Generowanie filmów" href="/pl/tools/video-generation" icon="video">
    Zamiana tekstu na film, obrazu na film i filmu na film za pomocą `video_generate`.
    Asynchroniczne — działa w tle i publikuje wynik, gdy jest gotowy.
  </Card>
  <Card title="Generowanie muzyki" href="/pl/tools/music-generation" icon="music">
    Generuj muzykę lub ścieżki dźwiękowe za pomocą `music_generate`. Asynchroniczne w
    sesjach czatu, ze współdzielonym cyklem życia zadania generowania multimediów.
  </Card>
  <Card title="Synteza mowy" href="/pl/tools/tts" icon="microphone">
    Konwertuj wychodzące odpowiedzi na mowę za pomocą narzędzia `tts` oraz
    konfiguracji `messages.tts`. Synchroniczne.
  </Card>
  <Card title="Rozumienie multimediów" href="/pl/nodes/media-understanding" icon="eye">
    Podsumowuj przychodzące obrazy, dźwięk i filmy przy użyciu dostawców modeli
    obsługujących analizę obrazu oraz wyspecjalizowanych pluginów do rozumienia multimediów.
  </Card>
  <Card title="Rozpoznawanie mowy" href="/pl/nodes/audio" icon="ear-listen">
    Transkrybuj przychodzące wiadomości głosowe za pomocą wsadowych dostawców STT lub
    dostawców strumieniowego STT dla Voice Call.
  </Card>
</CardGroup>

## Macierz możliwości dostawców

<Note>
Ta tabela obejmuje wyspecjalizowane pluginy generowania multimediów, TTS i STT. Wielu
dostawców modeli czatu (Anthropic, Google, OpenAI i inni) również rozumie
przychodzące multimedia za pomocą modelu generującego odpowiedzi; pełną listę dostawców zawiera
sekcja [Rozumienie multimediów](/pl/nodes/media-understanding#provider-support-matrix).
</Note>

| Dostawca          | Obraz | Film | Muzyka | TTS | STT | Głos w czasie rzeczywistym | Rozumienie multimediów |
| ----------------- | :---: | :---: | :---: | :-: | :-: | :------------: | :-----------------: |
| Alibaba           |       |   ✓   |       |     |     |                |                     |
| Azure Speech      |       |       |       |  ✓  |     |                |                     |
| BytePlus          |       |   ✓   |       |     |     |                |                     |
| ComfyUI           |   ✓   |   ✓   |   ✓   |     |     |                |                     |
| Deepgram          |       |       |       |     |  ✓  |                |                     |
| DeepInfra         |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| ElevenLabs        |       |       |       |  ✓  |  ✓  |                |                     |
| fal               |   ✓   |   ✓   |   ✓   |     |     |                |                     |
| Google            |   ✓   |   ✓   |   ✓   |  ✓  |  ✓  |       ✓        |          ✓          |
| Gradium           |       |       |       |  ✓  |     |                |                     |
| Inworld           |       |       |       |  ✓  |     |                |                     |
| LiteLLM           |   ✓   |       |       |     |     |                |                     |
| Lokalny CLI       |       |       |       |  ✓  |     |                |                     |
| Microsoft         |       |       |       |  ✓  |     |                |                     |
| Microsoft Foundry |   ✓   |       |       |     |     |                |                     |
| MiniMax           |   ✓   |   ✓   |   ✓   |  ✓  |     |                |                     |
| Mistral           |       |       |       |     |  ✓  |                |                     |
| OpenAI            |   ✓   |   ✓   |       |  ✓  |  ✓  |       ✓        |          ✓          |
| OpenRouter        |   ✓   |   ✓   |   ✓   |  ✓  |  ✓  |                |          ✓          |
| PixVerse          |       |   ✓   |       |     |     |                |                     |
| Qwen              |       |   ✓   |       |     |     |                |          ✓          |
| Runway            |       |   ✓   |       |     |     |                |                     |
| SenseAudio        |       |       |       |     |  ✓  |                |                     |
| Together          |       |   ✓   |       |     |     |                |                     |
| Volcengine        |       |       |       |  ✓  |     |                |                     |
| Vydra             |   ✓   |   ✓   |       |  ✓  |     |                |                     |
| xAI               |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Xiaomi MiMo       |       |       |       |  ✓  |     |                |                     |

<Note>
**Głos w czasie rzeczywistym** oznacza tutaj natywną dla dostawcy dwukierunkową komunikację w czasie rzeczywistym (tryb
`realtime` Talk, np. Gemini Live lub OpenAI Realtime API) — obecnie rejestrują ją tylko Google
i OpenAI. Deepgram, ElevenLabs, Mistral, OpenAI i xAI
oddzielnie rejestrują strumieniowe STT dla Voice Call (jednokierunkową zamianę dźwięku na tekst); zobacz
poniżej [Rozpoznawanie mowy i Voice Call](#speech-to-text-and-voice-call).
Głos xAI w czasie rzeczywistym jest funkcją dostępną u dostawcy nadrzędnego, ale nie jest rejestrowany w
OpenClaw, dopóki współdzielony kontrakt głosu w czasie rzeczywistym nie będzie w stanie go reprezentować.
</Note>

## Tryb asynchroniczny a synchroniczny

| Możliwość     | Tryb         | Uzasadnienie                                                                                                  |
| -------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| Obraz          | Asynchroniczny | Przetwarzanie przez dostawcę może trwać dłużej niż tura czatu; wygenerowane załączniki korzystają ze współdzielonej ścieżki ukończenia.   |
| Synteza mowy | Synchroniczny  | Odpowiedzi dostawcy wracają w ciągu kilku sekund; są dołączane do dźwięku odpowiedzi.                                   |
| Film          | Asynchroniczny | Przetwarzanie przez dostawcę trwa od 30 s do kilku minut; wolne kolejki mogą działać aż do skonfigurowanego limitu czasu. |
| Muzyka          | Asynchroniczny | Ma takie same cechy przetwarzania przez dostawcę jak film.                                                    |

W przypadku narzędzi asynchronicznych OpenClaw przesyła żądanie do dostawcy, natychmiast zwraca
identyfikator zadania i śledzi zadanie w rejestrze zadań. Agent kontynuuje
odpowiadanie na inne wiadomości podczas wykonywania zadania. Gdy dostawca zakończy pracę,
OpenClaw wybudza agenta, przekazując mu ścieżki wygenerowanych multimediów, aby mógł poinformować
użytkownika za pomocą zwykłego trybu widocznej odpowiedzi sesji: automatycznego dostarczenia odpowiedzi końcowej,
jeśli jest skonfigurowane, lub `message(action="send")`, gdy sesja wymaga
narzędzia wiadomości. Jeśli sesja osoby wysyłającej żądanie jest nieaktywna lub jej aktywne wybudzenie
się nie powiedzie, a w odpowiedzi końcowej nadal brakuje części wygenerowanych multimediów,
OpenClaw wysyła idempotentną bezpośrednią odpowiedź awaryjną zawierającą wyłącznie brakujące multimedia. Multimedia
dostarczone już w odpowiedzi końcowej nie są publikowane ponownie.

## Rozpoznawanie mowy i Voice Call

Deepgram, DeepInfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter,
SenseAudio i xAI mogą transkrybować przychodzący dźwięk za pomocą wsadowej
ścieżki `tools.media.audio`, jeśli są skonfigurowane. Pluginy kanałów, które wstępnie przetwarzają
wiadomość głosową na potrzeby filtrowania wzmianek lub analizy poleceń, oznaczają transkrybowany
załącznik w kontekście przychodzącym, dzięki czemu współdzielony etap rozumienia multimediów
ponownie wykorzystuje tę transkrypcję zamiast wykonywać drugie wywołanie STT dla tego samego
dźwięku.

Deepgram, ElevenLabs, Mistral, OpenAI i xAI rejestrują również dostawców
strumieniowego STT dla Voice Call, dzięki czemu dźwięk rozmowy telefonicznej na żywo może być przekazywany do wybranego
dostawcy bez oczekiwania na ukończenie nagrania.

W przypadku rozmów z użytkownikami na żywo preferuj [tryb Talk](/pl/nodes/talk). Wsadowe załączniki
dźwiękowe pozostają na ścieżce multimediów; komunikacja w czasie rzeczywistym w przeglądarce, natywne rozwiązania „naciśnij, aby mówić”,
telefonia i dźwięk ze spotkań powinny korzystać ze zdarzeń Talk oraz katalogów o zakresie sesji
zwracanych przez Gateway.

## Przypisania dostawców (podział dostawców między obszary)

<AccordionGroup>
  <Accordion title="Google">
    Obszary obrazów, filmów, muzyki, wsadowego TTS, wsadowego STT, głosu w czasie rzeczywistym po stronie zaplecza
    oraz rozumienia multimediów.
  </Accordion>
  <Accordion title="OpenAI">
    Obszary obrazów, filmów, wsadowego TTS, wsadowego STT, strumieniowego STT dla Voice Call, głosu
    w czasie rzeczywistym po stronie zaplecza oraz osadzeń pamięci.
  </Accordion>
  <Accordion title="DeepInfra">
    Obszary routingu czatu/modeli, generowania i edycji obrazów, zamiany tekstu na film, wsadowego TTS,
    wsadowego STT, rozumienia multimediów obrazowych oraz osadzeń pamięci.
    DeepInfra udostępnia również ponowne szeregowanie, klasyfikację, wykrywanie obiektów i
    inne natywne typy modeli; OpenClaw nie ma jeszcze kontraktu dostawcy dla tych
    kategorii, dlatego ten plugin ich nie rejestruje.
  </Accordion>
  <Accordion title="xAI">
    Obrazy, filmy, wyszukiwanie, wykonywanie kodu, wsadowe TTS, wsadowe STT oraz strumieniowe STT dla Voice
    Call. Głos xAI w czasie rzeczywistym jest funkcją dostępną u dostawcy nadrzędnego, ale
    nie jest rejestrowany w OpenClaw, dopóki współdzielony kontrakt głosu w czasie rzeczywistym nie będzie w stanie
    go reprezentować.
  </Accordion>
</AccordionGroup>

## Powiązane materiały

- [Generowanie obrazów](/pl/tools/image-generation)
- [Generowanie filmów](/pl/tools/video-generation)
- [Generowanie muzyki](/pl/tools/music-generation)
- [Synteza mowy](/pl/tools/tts)
- [Rozumienie multimediów](/pl/nodes/media-understanding)
- [Węzły dźwiękowe](/pl/nodes/audio)
- [Tryb Talk](/pl/nodes/talk)
