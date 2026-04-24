---
read_when:
    - Dodawanie lub modyfikowanie poleceń `openclaw infer`
    - Projektowanie stabilnej bezgłowej automatyzacji możliwości
summary: CLI z podejściem infer-first do workflow modeli, obrazów, audio, TTS, wideo, sieci i osadzania obsługiwanych przez providerów
title: CLI inferencji
x-i18n:
    generated_at: "2026-04-24T09:03:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a5a2ca9da4b5c26fbd61c271801d50a3d533bd4cc8430aa71f65e2cdc4fdee6
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` to kanoniczna bezgłowa powierzchnia dla workflow inferencji obsługiwanych przez providerów.

Celowo udostępnia rodziny możliwości, a nie surowe nazwy RPC Gateway i nie surowe identyfikatory narzędzi agenta.

## Zamień infer w Skill

Skopiuj i wklej to do agenta:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Dobry Skill oparty na infer powinien:

- mapować typowe intencje użytkownika na właściwe podpolecenie infer
- zawierać kilka kanonicznych przykładów infer dla obsługiwanych workflow
- preferować `openclaw infer ...` w przykładach i sugestiach
- unikać ponownego dokumentowania całej powierzchni infer w treści Skill

Typowy zakres Skill skoncentrowanego na infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Dlaczego używać infer

`openclaw infer` zapewnia jedno spójne CLI dla zadań inferencji obsługiwanych przez providerów w OpenClaw.

Korzyści:

- Używaj providerów i modeli już skonfigurowanych w OpenClaw zamiast tworzyć jednorazowe wrappery dla każdego backendu.
- Utrzymuj workflow modeli, obrazów, transkrypcji audio, TTS, wideo, sieci i osadzania pod jednym drzewem poleceń.
- Używaj stabilnego kształtu wyjścia `--json` dla skryptów, automatyzacji i workflow sterowanych przez agentów.
- Preferuj natywną powierzchnię OpenClaw, gdy zadanie sprowadza się zasadniczo do „uruchom inferencję”.
- Używaj zwykłej ścieżki lokalnej bez konieczności uruchamiania Gateway dla większości poleceń infer.

## Drzewo poleceń

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    status
    enable
    disable
    set-provider

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

## Typowe zadania

Ta tabela mapuje typowe zadania inferencji na odpowiadające im polecenie infer.

| Zadanie                  | Polecenie                                                             | Uwagi                                                 |
| ------------------------ | --------------------------------------------------------------------- | ----------------------------------------------------- |
| Uruchom prompt tekstowy/modelowy | `openclaw infer model run --prompt "..." --json`                      | Domyślnie używa zwykłej ścieżki lokalnej              |
| Wygeneruj obraz          | `openclaw infer image generate --prompt "..." --json`                 | Użyj `image edit`, gdy zaczynasz od istniejącego pliku |
| Opisz plik obrazu        | `openclaw infer image describe --file ./image.png --json`             | `--model` musi być obrazowym `<provider/model>`       |
| Transkrybuj audio        | `openclaw infer audio transcribe --file ./memo.m4a --json`            | `--model` musi mieć postać `<provider/model>`         |
| Syntezuj mowę            | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` jest zorientowane na Gateway             |
| Wygeneruj wideo          | `openclaw infer video generate --prompt "..." --json`                 |                                                       |
| Opisz plik wideo         | `openclaw infer video describe --file ./clip.mp4 --json`              | `--model` musi mieć postać `<provider/model>`         |
| Przeszukaj sieć          | `openclaw infer web search --query "..." --json`                      |                                                       |
| Pobierz stronę WWW       | `openclaw infer web fetch --url https://example.com --json`           |                                                       |
| Utwórz osadzania         | `openclaw infer embedding create --text "..." --json`                 |                                                       |

## Zachowanie

- `openclaw infer ...` to podstawowa powierzchnia CLI dla tych workflow.
- Używaj `--json`, gdy wyjście będzie konsumowane przez inne polecenie lub skrypt.
- Używaj `--provider` lub `--model provider/model`, gdy wymagany jest konkretny backend.
- Dla `image describe`, `audio transcribe` i `video describe`, `--model` musi mieć postać `<provider/model>`.
- Dla `image describe` jawne `--model` uruchamia bezpośrednio ten provider/model. Model musi obsługiwać obrazy w katalogu modeli albo konfiguracji providera. `codex/<model>` uruchamia ograniczoną turę rozumienia obrazu przez serwer aplikacji Codex; `openai-codex/<model>` używa ścieżki providera OpenAI Codex OAuth.
- Bezstanowe polecenia wykonania domyślnie działają lokalnie.
- Polecenia zarządzane stanem Gateway domyślnie używają Gateway.
- Zwykła ścieżka lokalna nie wymaga uruchomionej Gateway.

## Model

Używaj `model` do inferencji tekstowej obsługiwanej przez providerów oraz do inspekcji modeli/providerów.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Uwagi:

- `model run` ponownie wykorzystuje runtime agenta, więc nadpisania provider/model zachowują się jak przy zwykłym wykonaniu agenta.
- `model auth login`, `model auth logout` i `model auth status` zarządzają zapisanym stanem uwierzytelniania providera.

## Obraz

Używaj `image` do generowania, edycji i opisu.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

Uwagi:

- Użyj `image edit`, gdy zaczynasz od istniejących plików wejściowych.
- Dla `image describe` `--model` musi być obrazowym `<provider/model>`.
- W przypadku lokalnych modeli vision Ollama najpierw pobierz model i ustaw `OLLAMA_API_KEY` na dowolną wartość zastępczą, na przykład `ollama-local`. Zobacz [Ollama](/pl/providers/ollama#vision-and-image-description).

## Audio

Używaj `audio` do transkrypcji plików.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Uwagi:

- `audio transcribe` służy do transkrypcji plików, a nie do zarządzania sesjami czasu rzeczywistego.
- `--model` musi mieć postać `<provider/model>`.

## TTS

Używaj `tts` do syntezy mowy i stanu providera TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Uwagi:

- `tts status` domyślnie używa Gateway, ponieważ odzwierciedla stan TTS zarządzany przez Gateway.
- Używaj `tts providers`, `tts voices` i `tts set-provider`, aby sprawdzać i konfigurować zachowanie TTS.

## Wideo

Używaj `video` do generowania i opisu.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Uwagi:

- Dla `video describe` `--model` musi mieć postać `<provider/model>`.

## Sieć

Używaj `web` do workflow wyszukiwania i pobierania stron.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Uwagi:

- Używaj `web providers`, aby sprawdzić dostępnych, skonfigurowanych i wybranych providerów.

## Osadzanie

Używaj `embedding` do tworzenia wektorów i inspekcji providerów osadzania.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Wyjście JSON

Polecenia infer normalizują wyjście JSON pod wspólną kopertą:

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

Pola najwyższego poziomu są stabilne:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

## Typowe pułapki

```bash
# Bad
openclaw infer media image generate --prompt "friendly lobster"

# Good
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Bad
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Good
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Uwagi

- `openclaw capability ...` to alias dla `openclaw infer ...`.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Modele](/pl/concepts/models)
