---
read_when:
    - Szukasz przeglądu możliwości mediów
    - Decydujesz, którego dostawcę mediów skonfigurować
    - Chcesz zrozumieć, jak działa asynchroniczne generowanie mediów
summary: Ujednolicona strona startowa dla generowania mediów, rozumienia mediów i funkcji mowy
title: Przegląd mediów
x-i18n:
    generated_at: "2026-04-07T09:50:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfee08eb91ec3e827724c8fa99bff7465356f6f1ac1b146562f35651798e3fd6
    source_path: tools/media-overview.md
    workflow: 15
---

# Generowanie i rozumienie mediów

OpenClaw generuje obrazy, wideo i muzykę, rozumie media przychodzące (obrazy, audio, wideo) oraz odczytuje odpowiedzi na głos za pomocą text-to-speech. Wszystkie funkcje medialne są sterowane przez narzędzia: agent decyduje, kiedy ich użyć na podstawie rozmowy, a każde narzędzie pojawia się tylko wtedy, gdy skonfigurowano co najmniej jednego dostawcę zaplecza.

## Możliwości w skrócie

| Możliwość            | Narzędzie         | Dostawcy                                                                                     | Co robi                                                  |
| -------------------- | ----------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Generowanie obrazów  | `image_generate`  | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra                                                 | Tworzy lub edytuje obrazy na podstawie promptów tekstowych lub materiałów referencyjnych |
| Generowanie wideo    | `video_generate`  | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | Tworzy wideo na podstawie tekstu, obrazów lub istniejących filmów |
| Generowanie muzyki   | `music_generate`  | ComfyUI, Google, MiniMax                                                                     | Tworzy muzykę lub ścieżki audio na podstawie promptów tekstowych |
| Text-to-speech (TTS) | `tts`             | ElevenLabs, Microsoft, MiniMax, OpenAI                                                       | Zamienia odpowiedzi wychodzące na mowę                   |
| Rozumienie mediów    | (automatyczne)    | Dowolny dostawca modeli obsługujących vision/audio oraz fallbacki CLI                        | Podsumowuje obrazy, audio i wideo przychodzące           |

## Macierz możliwości dostawców

Ta tabela pokazuje, którzy dostawcy obsługują które funkcje medialne na całej platformie.

| Dostawca   | Obrazy | Wideo | Muzyka | TTS | STT / transkrypcja | Rozumienie mediów |
| ---------- | ------ | ----- | ------ | --- | ------------------ | ----------------- |
| Alibaba    |        | Tak   |        |     |                    |                   |
| BytePlus   |        | Tak   |        |     |                    |                   |
| ComfyUI    | Tak    | Tak   | Tak    |     |                    |                   |
| Deepgram   |        |       |        |     | Tak                |                   |
| ElevenLabs |        |       |        | Tak |                    |                   |
| fal        | Tak    | Tak   |        |     |                    |                   |
| Google     | Tak    | Tak   | Tak    |     |                    | Tak               |
| Microsoft  |        |       |        | Tak |                    |                   |
| MiniMax    | Tak    | Tak   | Tak    | Tak |                    |                   |
| OpenAI     | Tak    | Tak   |        | Tak | Tak                | Tak               |
| Qwen       |        | Tak   |        |     |                    |                   |
| Runway     |        | Tak   |        |     |                    |                   |
| Together   |        | Tak   |        |     |                    |                   |
| Vydra      | Tak    | Tak   |        |     |                    |                   |
| xAI        |        | Tak   |        |     |                    |                   |

<Note>
Rozumienie mediów korzysta z dowolnego modelu obsługującego vision lub audio, zarejestrowanego w konfiguracji dostawcy. Tabela powyżej wyróżnia dostawców z dedykowanym wsparciem dla rozumienia mediów; większość dostawców LLM z modelami multimodalnymi (Anthropic, Google, OpenAI itd.) może również rozumieć media przychodzące, gdy są skonfigurowane jako aktywny model odpowiedzi.
</Note>

## Jak działa generowanie asynchroniczne

Generowanie wideo i muzyki działa jako zadania w tle, ponieważ przetwarzanie po stronie dostawcy zwykle trwa od 30 sekund do kilku minut. Gdy agent wywołuje `video_generate` lub `music_generate`, OpenClaw wysyła żądanie do dostawcy, natychmiast zwraca identyfikator zadania i śledzi zadanie w rejestrze zadań. Agent nadal odpowiada na inne wiadomości, podczas gdy zadanie jest wykonywane. Gdy dostawca zakończy pracę, OpenClaw wybudza agenta, aby mógł opublikować gotowe media z powrotem w oryginalnym kanale. Generowanie obrazów i TTS są synchroniczne i kończą się inline wraz z odpowiedzią.

## Szybkie linki

- [Image Generation](/pl/tools/image-generation) -- generowanie i edycja obrazów
- [Video Generation](/pl/tools/video-generation) -- text-to-video, image-to-video i video-to-video
- [Music Generation](/pl/tools/music-generation) -- tworzenie muzyki i ścieżek audio
- [Text-to-Speech](/pl/tools/tts) -- zamienianie odpowiedzi na mowę
- [Media Understanding](/pl/nodes/media-understanding) -- rozumienie obrazów, audio i wideo przychodzących
