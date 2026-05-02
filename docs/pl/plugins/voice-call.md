---
read_when:
    - Chcesz wykonać wychodzące połączenie głosowe z OpenClaw
    - Konfigurujesz lub rozwijasz Plugin połączeń głosowych
    - Potrzebujesz obsługi głosu w czasie rzeczywistym lub transkrypcji strumieniowej w telefonii
sidebarTitle: Voice call
summary: Wykonuj wychodzące i odbieraj przychodzące połączenia głosowe za pośrednictwem Twilio, Telnyx lub Plivo, z opcjonalną obsługą głosu w czasie rzeczywistym i transkrypcją strumieniową
title: Plugin połączeń głosowych
x-i18n:
    generated_at: "2026-05-02T10:00:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f04b14ad1aafcc6036aff2301d9d0210c0cde333051ed89d498c51b4e0c0353
    source_path: plugins/voice-call.md
    workflow: 16
---

Połączenia głosowe dla OpenClaw przez Plugin. Obsługuje powiadomienia wychodzące,
wieloturowe konwersacje, pełnodupleksowy głos w czasie rzeczywistym, strumieniową
transkrypcję oraz połączenia przychodzące z zasadami listy dozwolonych.

**Obecni dostawcy:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (programowanie/brak sieci).

<Note>
Plugin Voice Call działa **wewnątrz procesu Gateway**. Jeśli używasz
zdalnego Gateway, zainstaluj i skonfiguruj Plugin na maszynie, na której działa
Gateway, a następnie uruchom ponownie Gateway, aby go załadować.
</Note>

## Szybki start

<Steps>
  <Step title="Zainstaluj Plugin">
    <Tabs>
      <Tab title="Z npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="Z folderu lokalnego (programowanie)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Jeśli npm zgłasza pakiet należący do OpenClaw jako przestarzały, ta wersja pakietu
    pochodzi ze starszego zewnętrznego ciągu pakietów; użyj bieżącej pakietowanej kompilacji
    OpenClaw albo ścieżki do folderu lokalnego, dopóki nie zostanie opublikowany nowszy pakiet npm.

    Następnie uruchom ponownie Gateway, aby Plugin został załadowany.

  </Step>
  <Step title="Skonfiguruj dostawcę i Webhook">
    Ustaw konfigurację w `plugins.entries.voice-call.config` (pełny kształt
    opisano poniżej w sekcji [Konfiguracja](#configuration)). Co najmniej:
    `provider`, poświadczenia dostawcy, `fromNumber` oraz publicznie
    osiągalny URL Webhook.
  </Step>
  <Step title="Zweryfikuj konfigurację">
    ```bash
    openclaw voicecall setup
    ```

    Domyślne wyjście jest czytelne w dziennikach czatu i terminalach. Sprawdza
    włączenie Plugin, poświadczenia dostawcy, ekspozycję Webhook oraz to, czy
    aktywny jest tylko jeden tryb audio (`streaming` albo `realtime`). Użyj
    `--json` w skryptach.

  </Step>
  <Step title="Test dymny">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Oba polecenia domyślnie są uruchomieniami próbnymi. Dodaj `--yes`, aby faktycznie
    wykonać krótkie wychodzące połączenie z powiadomieniem:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Dla Twilio, Telnyx i Plivo konfiguracja musi wskazywać **publiczny URL Webhook**.
Jeśli `publicUrl`, URL tunelu, URL Tailscale albo zapasowa ekspozycja serwera
wskazuje na loopback lub prywatną przestrzeń sieciową, konfiguracja zakończy się niepowodzeniem
zamiast uruchomić dostawcę, który nie może odbierać Webhooków operatora.
</Warning>

## Konfiguracja

Jeśli `enabled: true`, ale wybranemu dostawcy brakuje poświadczeń,
uruchomienie Gateway zapisze ostrzeżenie o niepełnej konfiguracji z brakującymi kluczami i
pominie uruchomienie środowiska wykonawczego. Polecenia, wywołania RPC i narzędzia agenta nadal
zwrócą dokładną brakującą konfigurację dostawcy podczas użycia.

<Note>
Poświadczenia voice-call akceptują SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` oraz `plugins.entries.voice-call.config.tts.providers.*.apiKey` są rozwiązywane przez standardową powierzchnię SecretRef; zobacz [powierzchnię poświadczeń SecretRef](/pl/reference/secretref-credential-surface).
</Note>

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // or "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // or TWILIO_FROM_NUMBER for Twilio
          toNumber: "+15550005678",
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, how can I help?",
              responseSystemPrompt: "You are a concise baseball card specialist.",
              tts: {
                providers: {
                  openai: { voice: "alloy" },
                },
              },
            },
          },

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx webhook public key from the Mission Control Portal
            // (Base64; can also be set via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },
          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook server
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook security (recommended for tunnels/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Public exposure (pick one)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* see Streaming transcription */ },
          realtime: { enabled: false /* see Realtime voice */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Uwagi o ekspozycji i bezpieczeństwie dostawców">
    - Twilio, Telnyx i Plivo wymagają **publicznie osiągalnego** URL Webhook.
    - `mock` to lokalny dostawca programistyczny (bez wywołań sieciowych).
    - Telnyx wymaga `telnyx.publicKey` (albo `TELNYX_PUBLIC_KEY`), chyba że `skipSignatureVerification` ma wartość true.
    - `skipSignatureVerification` służy tylko do testów lokalnych.
    - W bezpłatnym planie ngrok ustaw `publicUrl` na dokładny URL ngrok; weryfikacja podpisu jest zawsze wymuszana.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` zezwala na Webhooki Twilio z nieprawidłowymi podpisami **tylko** wtedy, gdy `tunnel.provider="ngrok"` i `serve.bind` jest loopback (lokalny agent ngrok). Tylko do lokalnego programowania.
    - URL-e bezpłatnego planu Ngrok mogą się zmieniać albo dodawać zachowanie strony pośredniej; jeśli `publicUrl` się rozjedzie, podpisy Twilio zawiodą. Produkcja: preferuj stabilną domenę albo tunel Tailscale.

  </Accordion>
  <Accordion title="Limity połączeń strumieniowych">
    - `streaming.preStartTimeoutMs` zamyka gniazda, które nigdy nie wyślą prawidłowej ramki `start`.
    - `streaming.maxPendingConnections` ogranicza łączną liczbę nieuwierzytelnionych gniazd przed startem.
    - `streaming.maxPendingConnectionsPerIp` ogranicza nieuwierzytelnione gniazda przed startem na źródłowy adres IP.
    - `streaming.maxConnections` ogranicza łączną liczbę otwartych gniazd strumienia mediów (oczekujące + aktywne).

  </Accordion>
  <Accordion title="Migracje starszej konfiguracji">
    Starsze konfiguracje używające `provider: "log"`, `twilio.from` albo starszych
    kluczy OpenAI `streaming.*` są przepisywane przez `openclaw doctor --fix`.
    Zapasowa ścieżka środowiska wykonawczego nadal akceptuje stare klucze voice-call, ale
    ścieżką przepisywania jest `openclaw doctor --fix`, a warstwa zgodności jest
    tymczasowa.

    Automatycznie migrowane klucze strumieniowania:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Zakres sesji

Domyślnie Voice Call używa `sessionScope: "per-phone"`, więc powtarzane połączenia od
tego samego dzwoniącego zachowują pamięć konwersacji. Ustaw `sessionScope: "per-call"`, gdy
każde połączenie operatora powinno zaczynać ze świeżym kontekstem, na przykład w przepływach
recepcji, rezerwacji, IVR albo mostka Google Meet, gdzie ten sam numer telefonu może
reprezentować różne spotkania.

## Konwersacje głosowe w czasie rzeczywistym

`realtime` wybiera pełnodupleksowego dostawcę głosu w czasie rzeczywistym dla dźwięku
połączenia na żywo. Jest oddzielny od `streaming`, które tylko przekazuje dźwięk do
dostawców transkrypcji w czasie rzeczywistym.

<Warning>
`realtime.enabled` nie można łączyć z `streaming.enabled`. Wybierz jeden
tryb audio na połączenie.
</Warning>

Bieżące zachowanie środowiska wykonawczego:

- `realtime.enabled` jest obsługiwane dla Twilio Media Streams.
- `realtime.provider` jest opcjonalne. Jeśli nie jest ustawione, Voice Call używa pierwszego zarejestrowanego dostawcy głosu w czasie rzeczywistym.
- Dołączani dostawcy głosu w czasie rzeczywistym: Google Gemini Live (`google`) i OpenAI (`openai`), rejestrowani przez ich Plugin dostawców.
- Surowa konfiguracja należąca do dostawcy znajduje się w `realtime.providers.<providerId>`.
- Voice Call domyślnie udostępnia współdzielone narzędzie czasu rzeczywistego `openclaw_agent_consult`. Model czasu rzeczywistego może je wywołać, gdy dzwoniący prosi o głębsze rozumowanie, bieżące informacje albo zwykłe narzędzia OpenClaw.
- `realtime.fastContext.enabled` jest domyślnie wyłączone. Gdy jest włączone, Voice Call najpierw przeszukuje zindeksowaną pamięć/kontekst sesji dla pytania konsultacji i zwraca te fragmenty modelowi czasu rzeczywistego w czasie `realtime.fastContext.timeoutMs`, zanim wróci do pełnego agenta konsultacyjnego tylko wtedy, gdy `realtime.fastContext.fallbackToConsult` ma wartość true.
- Jeśli `realtime.provider` wskazuje niezarejestrowanego dostawcę albo żaden dostawca głosu w czasie rzeczywistym nie jest zarejestrowany, Voice Call zapisuje ostrzeżenie i pomija media czasu rzeczywistego zamiast kończyć niepowodzeniem cały Plugin.
- Klucze sesji konsultacji ponownie używają zapisanej sesji połączenia, gdy jest dostępna, a następnie wracają do skonfigurowanego `sessionScope` (domyślnie `per-phone` albo `per-call` dla izolowanych połączeń).

### Zasada narzędzi

`realtime.toolPolicy` kontroluje uruchomienie konsultacji:

| Zasada           | Zachowanie                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Udostępnia narzędzie konsultacji i ogranicza zwykłego agenta do `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` oraz `memory_get`. |
| `owner`          | Udostępnia narzędzie konsultacji i pozwala zwykłemu agentowi używać normalnej zasady narzędzi agenta.                                                      |
| `none`           | Nie udostępnia narzędzia konsultacji. Niestandardowe `realtime.tools` nadal są przekazywane do dostawcy czasu rzeczywistego.                               |

### Przykłady dostawców czasu rzeczywistego

<Tabs>
  <Tab title="Google Gemini Live">
    Wartości domyślne: klucz API z `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` albo `GOOGLE_GENERATIVE_AI_API_KEY`; model
    `gemini-2.5-flash-native-audio-preview-12-2025`; głos `Kore`.

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              provider: "twilio",
              inboundPolicy: "allowlist",
              allowFrom: ["+15550005678"],
              realtime: {
                enabled: true,
                provider: "google",
                instructions: "Speak briefly. Call openclaw_agent_consult before using deeper tools.",
                toolPolicy: "safe-read-only",
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    voice: "Kore",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="OpenAI">
    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              realtime: {
                enabled: true,
                provider: "openai",
                providers: {
                  openai: { apiKey: "${OPENAI_API_KEY}" },
                },
              },
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

Zobacz [dostawcę Google](/pl/providers/google) i
[dostawcę OpenAI](/pl/providers/openai), aby poznać specyficzne dla dostawcy opcje głosu
w czasie rzeczywistym.

## Transkrypcja strumieniowa

`streaming` wybiera dostawcę transkrypcji w czasie rzeczywistym dla dźwięku połączenia na żywo.

Bieżące zachowanie środowiska wykonawczego:

- `streaming.provider` jest opcjonalne. Jeśli nie jest ustawione, Voice Call używa pierwszego zarejestrowanego dostawcy transkrypcji w czasie rzeczywistym.
- Dołączone dostawcy transkrypcji w czasie rzeczywistym: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) i xAI (`xai`), rejestrowane przez ich Pluginy dostawców.
- Surowa konfiguracja należąca do dostawcy znajduje się pod `streaming.providers.<providerId>`.
- Po wysłaniu przez Twilio zaakceptowanej wiadomości `start` strumienia Voice Call natychmiast rejestruje strumień, kolejkowuje przychodzące multimedia przez dostawcę transkrypcji, gdy dostawca się łączy, i uruchamia początkowe powitanie dopiero po gotowości transkrypcji w czasie rzeczywistym.
- Jeśli `streaming.provider` wskazuje niezarejestrowanego dostawcę albo żaden nie jest zarejestrowany, Voice Call zapisuje ostrzeżenie w logach i pomija strumieniowanie multimediów, zamiast powodować awarię całego Pluginu.

### Przykłady dostawcy strumieniowania

<Tabs>
  <Tab title="OpenAI">
    Domyślne wartości: klucz API `streaming.providers.openai.apiKey` lub
    `OPENAI_API_KEY`; model `gpt-4o-transcribe`; `silenceDurationMs: 800`;
    `vadThreshold: 0.5`.

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "openai",
                streamPath: "/voice/stream",
                providers: {
                  openai: {
                    apiKey: "sk-...", // optional if OPENAI_API_KEY is set
                    model: "gpt-4o-transcribe",
                    silenceDurationMs: 800,
                    vadThreshold: 0.5,
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="xAI">
    Domyślne wartości: klucz API `streaming.providers.xai.apiKey` lub `XAI_API_KEY`;
    punkt końcowy `wss://api.x.ai/v1/stt`; kodowanie `mulaw`; częstotliwość próbkowania `8000`;
    `endpointingMs: 800`; `interimResults: true`.

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                streamPath: "/voice/stream",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}", // optional if XAI_API_KEY is set
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## TTS dla połączeń

Voice Call używa podstawowej konfiguracji `messages.tts` do strumieniowania
mowy podczas połączeń. Możesz ją nadpisać w konfiguracji Pluginu z
**takim samym kształtem** — jest głęboko scalana z `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

<Warning>
**Microsoft speech jest ignorowane dla połączeń głosowych.** Dźwięk telefoniczny wymaga PCM;
obecny transport Microsoft nie udostępnia wyjścia PCM dla telefonii.
</Warning>

Uwagi dotyczące zachowania:

- Starsze klucze `tts.<provider>` w konfiguracji Pluginu (`openai`, `elevenlabs`, `microsoft`, `edge`) są naprawiane przez `openclaw doctor --fix`; zatwierdzona konfiguracja powinna używać `tts.providers.<provider>`.
- Podstawowe TTS jest używane, gdy strumieniowanie multimediów Twilio jest włączone; w przeciwnym razie połączenia wracają do natywnych głosów dostawcy.
- Jeśli strumień multimediów Twilio jest już aktywny, Voice Call nie wraca do TwiML `<Say>`. Jeśli w tym stanie TTS dla telefonii jest niedostępne, żądanie odtwarzania kończy się niepowodzeniem zamiast mieszać dwie ścieżki odtwarzania.
- Gdy TTS dla telefonii wraca do dostawcy zapasowego, Voice Call zapisuje ostrzeżenie z łańcuchem dostawców (`from`, `to`, `attempts`) na potrzeby debugowania.
- Gdy przerwanie wypowiedzi przez Twilio albo zamknięcie strumienia czyści oczekującą kolejkę TTS, zakolejkowane żądania odtwarzania są rozstrzygane zamiast pozostawiać dzwoniących oczekujących na zakończenie odtwarzania.

### Przykłady TTS

<Tabs>
  <Tab title="Tylko podstawowe TTS">
```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Nadpisanie na ElevenLabs (tylko połączenia)">
```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Nadpisanie modelu OpenAI (głębokie scalanie)">
```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

## Połączenia przychodzące

Domyślna polityka połączeń przychodzących to `disabled`. Aby włączyć połączenia przychodzące, ustaw:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` to ekran identyfikacji dzwoniącego o niskiej pewności. Plugin
normalizuje dostarczoną przez dostawcę wartość `From` i porównuje ją z
`allowFrom`. Weryfikacja Webhook uwierzytelnia dostarczenie przez dostawcę i
integralność ładunku, ale **nie** dowodzi własności numeru dzwoniącego
PSTN/VoIP. Traktuj `allowFrom` jako filtrowanie identyfikacji dzwoniącego, a nie silną
tożsamość dzwoniącego.
</Warning>

Automatyczne odpowiedzi używają systemu agentów. Dostosuj je za pomocą `responseModel`,
`responseSystemPrompt` i `responseTimeoutMs`.

### Routing według numeru

Użyj `numbers`, gdy jeden Plugin Voice Call odbiera połączenia dla wielu numerów
telefonu i każdy numer powinien zachowywać się jak inna linia. Na przykład jeden
numer może używać swobodnego asystenta osobistego, a inny persony biznesowej,
innego agenta odpowiedzi i innego głosu TTS.

Trasy są wybierane na podstawie dostarczonego przez dostawcę wybranego numeru `To`. Klucze muszą być
numerami E.164. Gdy połączenie nadejdzie, Voice Call jednorazowo rozwiązuje pasującą trasę,
zapisuje dopasowaną trasę w rekordzie połączenia i ponownie używa tej efektywnej konfiguracji
dla powitania, klasycznej ścieżki automatycznej odpowiedzi, ścieżki konsultacji w czasie rzeczywistym oraz
odtwarzania TTS. Jeśli żadna trasa nie pasuje, używana jest globalna konfiguracja Voice Call.
Połączenia wychodzące nie używają `numbers`; przekaż cel wychodzący, wiadomość i
sesję jawnie podczas inicjowania połączenia.

Nadpisania tras obecnie obsługują:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Wartość trasy `tts` jest głęboko scalana z globalną konfiguracją `tts` Voice Call, więc
zwykle możesz nadpisać tylko głos dostawcy:

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { voice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

### Kontrakt wyniku mówionego

Dla automatycznych odpowiedzi Voice Call dołącza ścisły kontrakt wyniku mówionego do
promptu systemowego:

```text
{"spoken":"..."}
```

Voice Call defensywnie wyodrębnia tekst mowy:

- Ignoruje ładunki oznaczone jako treść rozumowania/błędu.
- Parsuje bezpośredni JSON, JSON w bloku kodu lub wbudowane klucze `"spoken"`.
- Wraca do zwykłego tekstu i usuwa prawdopodobne wprowadzające akapity planowania/metadanych.

Dzięki temu odtwarzana mowa pozostaje skupiona na tekście przeznaczonym dla dzwoniącego i unika
wycieku tekstu planowania do dźwięku.

### Zachowanie uruchamiania rozmowy

Dla wychodzących połączeń `conversation` obsługa pierwszej wiadomości jest powiązana ze stanem
odtwarzania na żywo:

- Czyszczenie kolejki po przerwaniu wypowiedzi i automatyczna odpowiedź są tłumione tylko wtedy, gdy początkowe powitanie jest aktywnie wypowiadane.
- Jeśli początkowe odtwarzanie się nie powiedzie, połączenie wraca do `listening`, a początkowa wiadomość pozostaje w kolejce do ponowienia.
- Początkowe odtwarzanie dla strumieniowania Twilio zaczyna się przy połączeniu strumienia bez dodatkowego opóźnienia.
- Przerwanie wypowiedzi przerywa aktywne odtwarzanie i czyści zakolejkowane, ale jeszcze nieodtwarzane wpisy TTS Twilio. Wyczyszczone wpisy są rozstrzygane jako pominięte, więc logika odpowiedzi uzupełniającej może kontynuować bez czekania na dźwięk, który nigdy nie zostanie odtworzony.
- Rozmowy głosowe w czasie rzeczywistym używają własnej rundy otwierającej strumienia w czasie rzeczywistym. Voice Call **nie** publikuje starszej aktualizacji TwiML `<Say>` dla tej początkowej wiadomości, więc wychodzące sesje `<Connect><Stream>` pozostają podłączone.

### Okres karencji po rozłączeniu strumienia Twilio

Gdy strumień multimediów Twilio się rozłączy, Voice Call czeka **2000 ms** przed
automatycznym zakończeniem połączenia:

- Jeśli strumień połączy się ponownie w tym oknie, automatyczne zakończenie zostaje anulowane.
- Jeśli po okresie karencji żaden strumień nie zarejestruje się ponownie, połączenie zostaje zakończone, aby zapobiec zawieszonym aktywnym połączeniom.

## Zbieracz nieaktualnych połączeń

Użyj `staleCallReaperSeconds`, aby kończyć połączenia, które nigdy nie otrzymują końcowego
Webhook (na przykład połączenia w trybie powiadomień, które nigdy się nie kończą). Domyślna wartość
to `0` (wyłączone).

Zalecane zakresy:

- **Produkcja:** `120`–`300` sekund dla przepływów w stylu powiadomień.
- Utrzymuj tę wartość **wyższą niż `maxDurationSeconds`**, aby normalne połączenia mogły się zakończyć. Dobrym punktem startowym jest `maxDurationSeconds + 30–60` sekund.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Bezpieczeństwo Webhook

Gdy przed Gateway znajduje się proxy lub tunel, Plugin
rekonstruuje publiczny URL na potrzeby weryfikacji podpisu. Te opcje
kontrolują, którym przekazywanym nagłówkom się ufa:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Lista dozwolonych hostów z nagłówków przekazywania.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Ufaj przekazywanym nagłówkom bez listy dozwolonych.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Ufaj przekazywanym nagłówkom tylko wtedy, gdy zdalny adres IP żądania pasuje do listy.
</ParamField>

Dodatkowe zabezpieczenia:

- **Ochrona przed powtórzeniem** Webhook jest włączona dla Twilio i Plivo. Powtórzone prawidłowe żądania Webhook są potwierdzane, ale pomijane dla efektów ubocznych.
- Tury rozmowy Twilio zawierają token dla każdej tury w wywołaniach zwrotnych `<Gather>`, więc nieaktualne/powtórzone wywołania zwrotne mowy nie mogą spełnić nowszej oczekującej tury transkrypcji.
- Nieuwierzytelnione żądania Webhook są odrzucane przed odczytem treści, gdy brakuje wymaganych przez dostawcę nagłówków podpisu.
- Webhook voice-call używa współdzielonego profilu treści przed uwierzytelnieniem (64 KB / 5 sekund) oraz limitu jednoczesnych żądań na adres IP przed weryfikacją podpisu.

Przykład ze stabilnym hostem publicznym:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

Gdy Gateway jest już uruchomiony, operacyjne polecenia `voicecall` delegują
do środowiska uruchomieniowego voice-call należącego do Gateway, aby CLI nie wiązał drugiego
serwera Webhook. Jeśli żaden Gateway nie jest osiągalny, polecenia wracają do
samodzielnego środowiska uruchomieniowego CLI.

`latency` odczytuje `calls.jsonl` z domyślnej ścieżki przechowywania połączeń głosowych.
Użyj `--file <path>`, aby wskazać inny dziennik, oraz `--last <n>`, aby ograniczyć
analizę do ostatnich N rekordów (domyślnie 200). Dane wyjściowe obejmują p50/p90/p99
dla opóźnienia tury i czasów oczekiwania na nasłuchiwanie.

## Narzędzie agenta

Nazwa narzędzia: `voice_call`.

| Akcja           | Argumenty                                  |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

To repozytorium zawiera odpowiadający dokument Skills w `skills/voice-call/SKILL.md`.

## RPC Gateway

| Metoda               | Argumenty                                  |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` jest poprawne tylko z `mode: "conversation"`. Połączenia w trybie powiadomień
powinny używać `voicecall.dtmf` po utworzeniu połączenia, jeśli potrzebują cyfr
po połączeniu.

## Rozwiązywanie problemów

### Konfiguracja nie udostępnia webhooka

Uruchom konfigurację w tym samym środowisku, w którym działa Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Dla `twilio`, `telnyx` i `plivo` `webhook-exposure` musi być zielone. Skonfigurowany
`publicUrl` nadal kończy się niepowodzeniem, gdy wskazuje lokalną lub prywatną przestrzeń
sieciową, ponieważ operator nie może wywołać zwrotnie tych adresów. Nie używaj
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` ani `fd00::/8` jako `publicUrl`.

Wychodzące połączenia Twilio w trybie powiadomień wysyłają początkowy TwiML `<Say>` bezpośrednio w
żądaniu utworzenia połączenia, więc pierwsza wypowiadana wiadomość nie zależy od pobrania przez Twilio
TwiML webhooka. Publiczny Webhook jest nadal wymagany do wywołań zwrotnych statusu,
połączeń konwersacyjnych, DTMF przed połączeniem, strumieni czasu rzeczywistego oraz kontroli połączenia
po połączeniu.

Użyj jednej publicznej ścieżki ekspozycji:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // or
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Po zmianie konfiguracji zrestartuj lub przeładuj Gateway, a następnie uruchom:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` jest suchym przebiegiem, chyba że przekażesz `--yes`.

### Dane uwierzytelniające dostawcy zawodzą

Sprawdź wybranego dostawcę i wymagane pola danych uwierzytelniających:

- Twilio: `twilio.accountSid`, `twilio.authToken` i `fromNumber` albo
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` i `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` i
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` i `fromNumber`.

Dane uwierzytelniające muszą istnieć na hoście Gateway. Edycja lokalnego profilu powłoki
nie wpływa na już działający Gateway, dopóki nie zostanie zrestartowany lub nie przeładuje swojego
środowiska.

### Połączenia się rozpoczynają, ale webhooki dostawcy nie docierają

Potwierdź, że konsola dostawcy wskazuje dokładny publiczny URL webhooka:

```text
https://voice.example.com/voice/webhook
```

Następnie sprawdź stan środowiska uruchomieniowego:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Typowe przyczyny:

- `publicUrl` wskazuje inną ścieżkę niż `serve.path`.
- URL tunelu zmienił się po uruchomieniu Gateway.
- Proxy przekazuje żądanie, ale usuwa lub przepisuje nagłówki host/proto.
- Zapora lub DNS kieruje publiczną nazwę hosta gdzie indziej niż do Gateway.
- Gateway został zrestartowany bez włączonego Plugin Voice Call.

Gdy przed Gateway znajduje się odwrotne proxy lub tunel, ustaw
`webhookSecurity.allowedHosts` na publiczną nazwę hosta albo użyj
`webhookSecurity.trustedProxyIPs` dla znanego adresu proxy. Używaj
`webhookSecurity.trustForwardingHeaders` tylko wtedy, gdy granica proxy jest pod
Twoją kontrolą.

### Weryfikacja podpisu kończy się niepowodzeniem

Podpisy dostawcy są sprawdzane względem publicznego URL, który OpenClaw rekonstruuje
z przychodzącego żądania. Jeśli podpisy zawodzą:

- Potwierdź, że URL webhooka dostawcy dokładnie odpowiada `publicUrl`, włącznie ze
  schematem, hostem i ścieżką.
- W przypadku URL-i ngrok w bezpłatnej warstwie aktualizuj `publicUrl`, gdy zmienia się nazwa hosta tunelu.
- Upewnij się, że proxy zachowuje oryginalne nagłówki hosta i proto, albo skonfiguruj
  `webhookSecurity.allowedHosts`.
- Nie włączaj `skipSignatureVerification` poza testami lokalnymi.

### Dołączanie Google Meet przez Twilio kończy się niepowodzeniem

Google Meet używa tego pluginu do dołączania przez połączenie telefoniczne Twilio. Najpierw zweryfikuj Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Następnie jawnie zweryfikuj transport Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Jeśli Voice Call jest zielone, ale uczestnik Meet nigdy nie dołącza, sprawdź numer
telefoniczny Meet, PIN i `--dtmf-sequence`. Połączenie telefoniczne może być zdrowe, podczas gdy
spotkanie odrzuca lub ignoruje niepoprawną sekwencję DTMF.

Google Meet przekazuje sekwencję DTMF Meet i tekst wprowadzający do `voicecall.start`.
W przypadku połączeń Twilio Voice Call najpierw serwuje TwiML DTMF, przekierowuje z powrotem do
webhooka, a następnie otwiera strumień multimediów czasu rzeczywistego, aby zapisane wprowadzenie zostało wygenerowane
po dołączeniu uczestnika telefonicznego do spotkania.

Użyj `openclaw logs --follow`, aby śledzić fazę na żywo. Zdrowe dołączenie Twilio Meet
rejestruje tę kolejność:

- Google Meet deleguje dołączenie Twilio do Voice Call.
- Voice Call zapisuje TwiML DTMF przed połączeniem.
- Początkowy TwiML Twilio jest zużywany i serwowany przed obsługą czasu rzeczywistego.
- Voice Call serwuje TwiML czasu rzeczywistego dla połączenia Twilio.
- Most czasu rzeczywistego uruchamia się z początkowym powitaniem w kolejce.

`openclaw voicecall tail` nadal pokazuje utrwalone rekordy połączeń; jest przydatne do
stanu połączeń i transkrypcji, ale nie każde przejście webhooka/czasu rzeczywistego pojawia się
tam.

### Połączenie czasu rzeczywistego nie ma mowy

Potwierdź, że włączony jest tylko jeden tryb audio. `realtime.enabled` i
`streaming.enabled` nie mogą być jednocześnie true.

Dla połączeń Twilio w czasie rzeczywistym zweryfikuj także:

- Plugin dostawcy czasu rzeczywistego jest załadowany i zarejestrowany.
- `realtime.provider` jest nieustawione albo wskazuje zarejestrowanego dostawcę.
- Klucz API dostawcy jest dostępny dla procesu Gateway.
- `openclaw logs --follow` pokazuje, że TwiML czasu rzeczywistego został zaserwowany, most czasu rzeczywistego
  został uruchomiony, a początkowe powitanie dodane do kolejki.

## Powiązane

- [Tryb rozmowy](/pl/nodes/talk)
- [Zamiana tekstu na mowę](/pl/tools/tts)
- [Wybudzanie głosowe](/pl/nodes/voicewake)
