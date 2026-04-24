---
read_when:
    - Szukasz przeglądu możliwości multimedialnych
    - Decydowanie, którego dostawcę multimediów skonfigurować
    - Zrozumienie, jak działa asynchroniczne generowanie multimediów
summary: Ujednolicona strona docelowa dla możliwości generowania, rozumienia i mowy dla multimediów
title: Przegląd multimediów
x-i18n:
    generated_at: "2026-04-24T09:37:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 469fb173ac3853011b8cd4f89f3ab97dd7d14e12e4e1d7d87e84de05d025a593
    source_path: tools/media-overview.md
    workflow: 15
---

# Generowanie i rozumienie multimediów

OpenClaw generuje obrazy, filmy i muzykę, rozumie multimedia przychodzące (obrazy, audio, wideo) oraz odczytuje odpowiedzi na głos za pomocą text-to-speech. Wszystkie możliwości multimedialne są sterowane narzędziami: agent decyduje, kiedy ich użyć na podstawie rozmowy, a każde narzędzie pojawia się tylko wtedy, gdy skonfigurowano co najmniej jednego dostawcę zaplecza.

## Możliwości w skrócie

| Możliwość             | Narzędzie        | Dostawcy                                                                                     | Co robi                                                   |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Generowanie obrazów   | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                            | Tworzy lub edytuje obrazy na podstawie promptów tekstowych lub referencji |
| Generowanie wideo     | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Tworzy filmy na podstawie tekstu, obrazów lub istniejących filmów |
| Generowanie muzyki    | `music_generate` | ComfyUI, Google, MiniMax                                                                     | Tworzy muzykę lub ścieżki audio na podstawie promptów tekstowych |
| Text-to-speech (TTS)  | `tts`            | ElevenLabs, Microsoft, MiniMax, OpenAI, xAI                                                  | Zamienia odpowiedzi wychodzące na mowę                    |
| Rozumienie multimediów| (automatyczne)   | Dowolny dostawca modeli z obsługą vision/audio oraz fallbacki CLI                            | Podsumowuje obrazy, audio i wideo przychodzące            |

## Macierz możliwości dostawców

Ta tabela pokazuje, którzy dostawcy obsługują które możliwości multimedialne na całej platformie.

| Dostawca  | Obrazy | Wideo | Muzyka | TTS | STT / Transkrypcja | Rozumienie multimediów |
| --------- | ------ | ----- | ------ | --- | ------------------ | ---------------------- |
| Alibaba   |        | Tak   |        |     |                    |                        |
| BytePlus  |        | Tak   |        |     |                    |                        |
| ComfyUI   | Tak    | Tak   | Tak    |     |                    |                        |
| Deepgram  |        |       |        |     | Tak                |                        |
| ElevenLabs|        |       |        | Tak | Tak                |                        |
| fal       | Tak    | Tak   |        |     |                    |                        |
| Google    | Tak    | Tak   | Tak    |     |                    | Tak                    |
| Microsoft |        |       |        | Tak |                    |                        |
| MiniMax   | Tak    | Tak   | Tak    | Tak |                    |                        |
| Mistral   |        |       |        |     | Tak                |                        |
| OpenAI    | Tak    | Tak   |        | Tak | Tak                | Tak                    |
| Qwen      |        | Tak   |        |     |                    |                        |
| Runway    |        | Tak   |        |     |                    |                        |
| Together  |        | Tak   |        |     |                    |                        |
| Vydra     | Tak    | Tak   |        |     |                    |                        |
| xAI       | Tak    | Tak   |        | Tak | Tak                | Tak                    |

<Note>
Rozumienie multimediów wykorzystuje dowolny model z obsługą vision lub audio zarejestrowany w konfiguracji dostawców. Powyższa tabela wyróżnia dostawców z dedykowaną obsługą rozumienia multimediów; większość dostawców LLM z modelami multimodalnymi (Anthropic, Google, OpenAI itd.) również potrafi rozumieć multimedia przychodzące, gdy są skonfigurowani jako aktywny model odpowiedzi.
</Note>

## Jak działa generowanie asynchroniczne

Generowanie wideo i muzyki działa jako zadania w tle, ponieważ przetwarzanie po stronie dostawców zwykle trwa od 30 sekund do kilku minut. Gdy agent wywołuje `video_generate` lub `music_generate`, OpenClaw wysyła żądanie do dostawcy, natychmiast zwraca identyfikator zadania i śledzi zadanie w rejestrze zadań. Agent nadal odpowiada na inne wiadomości podczas działania zadania. Gdy dostawca zakończy pracę, OpenClaw wybudza agenta, aby mógł opublikować gotowe multimedia z powrotem w oryginalnym kanale. Generowanie obrazów i TTS są synchroniczne i kończą się inline wraz z odpowiedzią.

Deepgram, ElevenLabs, Mistral, OpenAI i xAI mogą transkrybować przychodzące
audio przez ścieżkę wsadową `tools.media.audio`, jeśli są skonfigurowane. Deepgram,
ElevenLabs, Mistral, OpenAI i xAI rejestrują też dostawców strumieniowego STT dla Voice Call,
dzięki czemu dźwięk z rozmów telefonicznych na żywo może być przekazywany do wybranego dostawcy
bez czekania na ukończenie nagrania.

OpenAI mapuje się na powierzchnie OpenClaw dla obrazów, wideo, wsadowego TTS, wsadowego STT, strumieniowego STT dla Voice Call, głosu realtime i osadzania pamięci. xAI obecnie
mapuje się na powierzchnie OpenClaw dla obrazów, wideo, wyszukiwania, wykonywania kodu, wsadowego TTS, wsadowego STT
oraz strumieniowego STT dla Voice Call. Głos xAI Realtime jest możliwością upstream,
ale nie jest rejestrowany w OpenClaw, dopóki współdzielony kontrakt
głosu realtime nie będzie mógł go reprezentować.

## Szybkie linki

- [Generowanie obrazów](/pl/tools/image-generation) -- generowanie i edytowanie obrazów
- [Generowanie wideo](/pl/tools/video-generation) -- tekst na wideo, obraz na wideo i wideo na wideo
- [Generowanie muzyki](/pl/tools/music-generation) -- tworzenie muzyki i ścieżek audio
- [Text-to-Speech](/pl/tools/tts) -- zamienianie odpowiedzi na mowę
- [Rozumienie multimediów](/pl/nodes/media-understanding) -- rozumienie przychodzących obrazów, audio i wideo

## Powiązane

- [Generowanie obrazów](/pl/tools/image-generation)
- [Generowanie wideo](/pl/tools/video-generation)
- [Generowanie muzyki](/pl/tools/music-generation)
- [Text-to-speech](/pl/tools/tts)
