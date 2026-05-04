---
read_when:
    - Chcesz nawiązać wychodzące połączenie głosowe z poziomu OpenClaw
    - Konfigurujesz lub rozwijasz Plugin do połączeń głosowych
    - Potrzebujesz głosu w czasie rzeczywistym lub transkrypcji strumieniowej w telefonii
sidebarTitle: Voice call
summary: Nawiązuj wychodzące i odbieraj przychodzące połączenia głosowe za pośrednictwem Twilio, Telnyx lub Plivo, z opcjonalną obsługą głosu w czasie rzeczywistym i transkrypcji strumieniowej
title: Plugin połączeń głosowych
x-i18n:
    generated_at: "2026-05-04T07:05:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ec2c22dcc9073572963744685a432328787bcedb14025e0326c20d9d842f857
    source_path: plugins/voice-call.md
    workflow: 16
---

Połączenia głosowe dla OpenClaw przez plugin. Obsługuje powiadomienia wychodzące,
rozmowy wieloturowe, pełnodupleksowy głos w czasie rzeczywistym, strumieniową
transkrypcję oraz połączenia przychodzące z zasadami listy dozwolonych.

**Obecni dostawcy:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (dev/brak sieci).

<Note>
Plugin Voice Call działa **wewnątrz procesu Gateway**. Jeśli używasz
zdalnego Gateway, zainstaluj i skonfiguruj plugin na maszynie uruchamiającej
Gateway, a następnie zrestartuj Gateway, aby go wczytać.
</Note>

## Szybki start

<Steps>
  <Step title="Install the plugin">
    <Tabs>
      <Tab title="From npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="From a local folder (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Użyj samej nazwy pakietu, aby śledzić bieżący oficjalny tag wydania. Przypinaj
    dokładną wersję tylko wtedy, gdy potrzebujesz powtarzalnej instalacji.

    Następnie zrestartuj Gateway, aby plugin został wczytany.

  </Step>
  <Step title="Configure provider and webhook">
    Ustaw konfigurację w `plugins.entries.voice-call.config` (pełny kształt znajdziesz
    niżej w sekcji [Konfiguracja](#configuration)). Co najmniej:
    `provider`, poświadczenia dostawcy, `fromNumber` oraz publicznie
    dostępny URL Webhook.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    Domyślne wyjście jest czytelne w logach czatu i terminalach. Sprawdza
    włączenie pluginu, poświadczenia dostawcy, ekspozycję Webhook oraz to,
    że aktywny jest tylko jeden tryb audio (`streaming` albo `realtime`). Użyj
    `--json` w skryptach.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Oba polecenia domyślnie są próbami bez wykonania zmian. Dodaj `--yes`, aby faktycznie wykonać krótkie
    połączenie wychodzące z powiadomieniem:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Dla Twilio, Telnyx i Plivo konfiguracja musi wskazywać **publiczny URL Webhook**.
Jeśli `publicUrl`, URL tunelu, URL Tailscale albo zapasowa ścieżka udostępniania
rozwiązuje się do loopback lub prywatnej przestrzeni sieciowej, konfiguracja kończy się niepowodzeniem zamiast
uruchamiać dostawcę, który nie może odbierać webhooków operatorów.
</Warning>

## Konfiguracja

Jeśli `enabled: true`, ale wybranemu dostawcy brakuje poświadczeń,
uruchamianie Gateway zapisuje ostrzeżenie o niepełnej konfiguracji z brakującymi kluczami i
pomija uruchomienie środowiska wykonawczego. Polecenia, wywołania RPC i narzędzia agenta nadal
zwracają dokładnie brakującą konfigurację dostawcy, gdy są używane.

<Note>
Poświadczenia Voice Call akceptują SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` i `plugins.entries.voice-call.config.tts.providers.*.apiKey` są rozwiązywane przez standardową powierzchnię SecretRef; zobacz [powierzchnia poświadczeń SecretRef](/pl/reference/secretref-credential-surface).
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
  <Accordion title="Provider exposure and security notes">
    - Twilio, Telnyx i Plivo wymagają **publicznie osiągalnego** URL Webhook.
    - `mock` to lokalny dostawca deweloperski (bez wywołań sieciowych).
    - Telnyx wymaga `telnyx.publicKey` (albo `TELNYX_PUBLIC_KEY`), chyba że `skipSignatureVerification` ma wartość true.
    - `skipSignatureVerification` jest przeznaczone wyłącznie do testów lokalnych.
    - W darmowym planie ngrok ustaw `publicUrl` na dokładny URL ngrok; weryfikacja podpisu jest zawsze wymuszana.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` zezwala na webhooki Twilio z nieprawidłowymi podpisami **tylko** wtedy, gdy `tunnel.provider="ngrok"` i `serve.bind` jest loopback (lokalny agent ngrok). Tylko lokalny dev.
    - URL-e darmowego planu ngrok mogą się zmieniać albo dodawać stronę pośrednią; jeśli `publicUrl` się rozjedzie, podpisy Twilio zawiodą. Produkcja: preferuj stabilną domenę albo lejek Tailscale.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` zamyka gniazda, które nigdy nie wysyłają prawidłowej ramki `start`.
    - `streaming.maxPendingConnections` ogranicza łączną liczbę nieuwierzytelnionych gniazd przed startem.
    - `streaming.maxPendingConnectionsPerIp` ogranicza nieuwierzytelnione gniazda przed startem dla każdego źródłowego adresu IP.
    - `streaming.maxConnections` ogranicza łączną liczbę otwartych gniazd strumienia mediów (oczekujących + aktywnych).

  </Accordion>
  <Accordion title="Legacy config migrations">
    Starsze konfiguracje używające `provider: "log"`, `twilio.from` albo starszych
    kluczy OpenAI `streaming.*` są przepisywane przez `openclaw doctor --fix`.
    Zapasowa obsługa w środowisku wykonawczym na razie nadal akceptuje stare klucze voice-call, ale
    ścieżką przepisywania jest `openclaw doctor --fix`, a warstwa zgodności jest
    tymczasowa.

    Automatycznie migrowane klucze streaming:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Zakres sesji

Domyślnie Voice Call używa `sessionScope: "per-phone"`, więc kolejne połączenia od
tego samego dzwoniącego zachowują pamięć rozmowy. Ustaw `sessionScope: "per-call"`, gdy
każde połączenie operatora powinno zaczynać ze świeżym kontekstem, na przykład w recepcji,
rezerwacjach, IVR albo przepływach mostka Google Meet, gdzie ten sam numer telefonu może
reprezentować różne spotkania.

## Rozmowy głosowe w czasie rzeczywistym

`realtime` wybiera pełnodupleksowego dostawcę głosu w czasie rzeczywistym dla dźwięku
połączenia na żywo. Jest to oddzielne od `streaming`, które tylko przekazuje dźwięk do
dostawców transkrypcji w czasie rzeczywistym.

<Warning>
`realtime.enabled` nie może być łączone z `streaming.enabled`. Wybierz jeden
tryb audio na połączenie.
</Warning>

Bieżące zachowanie środowiska wykonawczego:

- `realtime.enabled` jest obsługiwane dla Twilio Media Streams.
- `realtime.provider` jest opcjonalne. Jeśli nie jest ustawione, Voice Call używa pierwszego zarejestrowanego dostawcy głosu w czasie rzeczywistym.
- Dołączeni dostawcy głosu w czasie rzeczywistym: Google Gemini Live (`google`) i OpenAI (`openai`), rejestrowani przez ich pluginy dostawców.
- Surowa konfiguracja właściciela dostawcy znajduje się pod `realtime.providers.<providerId>`.
- Voice Call domyślnie udostępnia współdzielone narzędzie czasu rzeczywistego `openclaw_agent_consult`. Model czasu rzeczywistego może je wywołać, gdy dzwoniący prosi o głębsze rozumowanie, aktualne informacje albo standardowe narzędzia OpenClaw.
- `realtime.fastContext.enabled` jest domyślnie wyłączone. Po włączeniu Voice Call najpierw przeszukuje zaindeksowaną pamięć/kontekst sesji dla pytania konsultacji i zwraca te fragmenty modelowi czasu rzeczywistego w czasie `realtime.fastContext.timeoutMs`, zanim przejdzie do pełnego agenta konsultacji tylko wtedy, gdy `realtime.fastContext.fallbackToConsult` ma wartość true.
- Jeśli `realtime.provider` wskazuje niezarejestrowanego dostawcę albo żaden dostawca głosu w czasie rzeczywistym nie jest w ogóle zarejestrowany, Voice Call zapisuje ostrzeżenie i pomija media czasu rzeczywistego zamiast powodować awarię całego pluginu.
- Klucze sesji konsultacji ponownie używają zapisanej sesji połączenia, gdy jest dostępna, a następnie przechodzą do skonfigurowanego `sessionScope` (`per-phone` domyślnie albo `per-call` dla izolowanych połączeń).

### Zasady narzędzi

`realtime.toolPolicy` kontroluje przebieg konsultacji:

| Zasada           | Zachowanie                                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Udostępnij narzędzie konsultacji i ogranicz zwykłego agenta do `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` i `memory_get`. |
| `owner`          | Udostępnij narzędzie konsultacji i pozwól zwykłemu agentowi używać normalnych zasad narzędzi agenta.                                     |
| `none`           | Nie udostępniaj narzędzia konsultacji. Niestandardowe `realtime.tools` nadal są przekazywane do dostawcy czasu rzeczywistego.            |

### Przykłady dostawców czasu rzeczywistego

<Tabs>
  <Tab title="Google Gemini Live">
    Wartości domyślne: klucz API z `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` albo `GOOGLE_GENERATIVE_AI_API_KEY`; model
    `gemini-2.5-flash-native-audio-preview-12-2025`; głos `Kore`.
    `sessionResumption` i `contextWindowCompression` są domyślnie włączone dla dłuższych,
    wznawialnych połączeń. Użyj `silenceDurationMs`, `startSensitivity` i
    `endSensitivity`, aby dostroić szybsze przejmowanie tury przy dźwięku telefonicznym.

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
                    silenceDurationMs: 500,
                    startSensitivity: "high",
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
[dostawcę OpenAI](/pl/providers/openai), aby poznać opcje głosu w czasie rzeczywistym
specyficzne dla dostawcy.

## Transkrypcja strumieniowa

`streaming` wybiera dostawcę transkrypcji w czasie rzeczywistym dla dźwięku rozmowy na żywo.

Bieżące zachowanie środowiska uruchomieniowego:

- `streaming.provider` jest opcjonalne. Jeśli nie jest ustawione, Voice Call używa pierwszego zarejestrowanego dostawcy transkrypcji w czasie rzeczywistym.
- Wbudowani dostawcy transkrypcji w czasie rzeczywistym: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) oraz xAI (`xai`), rejestrowani przez ich pluginy dostawców.
- Surowa konfiguracja należąca do dostawcy znajduje się pod `streaming.providers.<providerId>`.
- Po wysłaniu przez Twilio zaakceptowanej wiadomości `start` strumienia Voice Call natychmiast rejestruje strumień, kolejkuje przychodzące media przez dostawcę transkrypcji podczas łączenia dostawcy i uruchamia początkowe powitanie dopiero wtedy, gdy transkrypcja w czasie rzeczywistym jest gotowa.
- Jeśli `streaming.provider` wskazuje niezarejestrowanego dostawcę albo żaden dostawca nie jest zarejestrowany, Voice Call zapisuje ostrzeżenie w logach i pomija strumieniowanie mediów zamiast powodować błąd całego pluginu.

### Przykłady dostawców strumieniowania

<Tabs>
  <Tab title="OpenAI">
    Wartości domyślne: klucz API `streaming.providers.openai.apiKey` lub
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
    Wartości domyślne: klucz API `streaming.providers.xai.apiKey` lub `XAI_API_KEY`;
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

Voice Call używa podstawowej konfiguracji `messages.tts` do strumieniowej
mowy w połączeniach. Możesz ją nadpisać w konfiguracji pluginu za pomocą
**tego samego kształtu** — jest ona głęboko scalana z `messages.tts`.

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
**Microsoft speech jest ignorowany dla połączeń głosowych.** Dźwięk telefoniczny wymaga PCM;
bieżący transport Microsoft nie udostępnia telefonicznego wyjścia PCM.
</Warning>

Uwagi dotyczące zachowania:

- Starsze klucze `tts.<provider>` w konfiguracji pluginu (`openai`, `elevenlabs`, `microsoft`, `edge`) są naprawiane przez `openclaw doctor --fix`; zatwierdzona konfiguracja powinna używać `tts.providers.<provider>`.
- Podstawowe TTS jest używane, gdy strumieniowanie mediów Twilio jest włączone; w przeciwnym razie połączenia wracają do natywnych głosów dostawcy.
- Jeśli strumień mediów Twilio jest już aktywny, Voice Call nie wraca do TwiML `<Say>`. Jeśli telefoniczne TTS jest w tym stanie niedostępne, żądanie odtwarzania kończy się błędem zamiast mieszać dwie ścieżki odtwarzania.
- Gdy telefoniczne TTS wraca do dostawcy zapasowego, Voice Call zapisuje ostrzeżenie z łańcuchem dostawców (`from`, `to`, `attempts`) na potrzeby debugowania.
- Gdy barge-in Twilio lub zamknięcie strumienia czyści oczekującą kolejkę TTS, zakolejkowane żądania odtwarzania są rozstrzygane zamiast zawieszać rozmówców oczekujących na zakończenie odtwarzania.

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
`inboundPolicy: "allowlist"` to ekran identyfikacji numeru dzwoniącego o niskim poziomie pewności. Plugin normalizuje dostarczoną przez dostawcę wartość `From` i porównuje ją z
`allowFrom`. Weryfikacja Webhook uwierzytelnia dostarczenie przez dostawcę i
integralność ładunku, ale **nie** potwierdza własności numeru dzwoniącego
PSTN/VoIP. Traktuj `allowFrom` jako filtrowanie identyfikacji numeru dzwoniącego, a nie silną
tożsamość dzwoniącego.
</Warning>

Automatyczne odpowiedzi używają systemu agentów. Dostosuj je za pomocą `responseModel`,
`responseSystemPrompt` i `responseTimeoutMs`.

### Routing według numeru

Użyj `numbers`, gdy jeden plugin Voice Call odbiera połączenia dla wielu numerów
telefonów, a każdy numer powinien zachowywać się jak osobna linia. Na przykład jeden
numer może używać swobodnego osobistego asystenta, a inny persony biznesowej,
innego agenta odpowiedzi i innego głosu TTS.

Trasy są wybierane na podstawie dostarczonego przez dostawcę wybranego numeru `To`. Klucze muszą być
numerami E.164. Gdy połączenie przychodzi, Voice Call raz rozwiązuje pasującą trasę,
zapisuje dopasowaną trasę w rekordzie połączenia i ponownie używa tej efektywnej konfiguracji
dla powitania, klasycznej ścieżki automatycznej odpowiedzi, ścieżki konsultacji w czasie rzeczywistym i odtwarzania
TTS. Jeśli żadna trasa nie pasuje, używana jest globalna konfiguracja Voice Call.
Połączenia wychodzące nie używają `numbers`; podczas inicjowania połączenia przekaż jawnie cel wychodzący, wiadomość i
sesję.

Nadpisania tras obecnie obsługują:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Wartość trasy `tts` jest głęboko scalana z globalną konfiguracją Voice Call `tts`, więc
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

### Kontrakt wyjścia mówionego

W przypadku automatycznych odpowiedzi Voice Call dołącza do promptu systemowego ścisły kontrakt wyjścia mówionego:

```text
{"spoken":"..."}
```

Voice Call defensywnie wyodrębnia tekst mowy:

- Ignoruje ładunki oznaczone jako treść rozumowania/błędu.
- Parsuje bezpośredni JSON, JSON w bloku ogrodzonym albo wbudowane klucze `"spoken"`.
- Wraca do zwykłego tekstu i usuwa prawdopodobne akapity wprowadzające planowania/metadanych.

Dzięki temu odtwarzanie mówione koncentruje się na tekście przeznaczonym dla rozmówcy i unika
wycieku tekstu planowania do dźwięku.

### Zachowanie uruchamiania rozmowy

W przypadku wychodzących połączeń `conversation` obsługa pierwszej wiadomości jest powiązana ze stanem odtwarzania na żywo:

- Czyszczenie kolejki barge-in i automatyczna odpowiedź są wstrzymywane tylko wtedy, gdy początkowe powitanie aktywnie mówi.
- Jeśli początkowe odtwarzanie się nie powiedzie, połączenie wraca do stanu `listening`, a początkowa wiadomość pozostaje w kolejce do ponowienia.
- Początkowe odtwarzanie dla strumieniowania Twilio zaczyna się po połączeniu strumienia bez dodatkowego opóźnienia.
- Barge-in przerywa aktywne odtwarzanie i czyści zakolejkowane, ale jeszcze nieodtwarzane wpisy Twilio TTS. Wyczyszczone wpisy rozstrzygają się jako pominięte, dzięki czemu logika odpowiedzi następczej może kontynuować bez czekania na dźwięk, który nigdy nie zostanie odtworzony.
- Rozmowy głosowe w czasie rzeczywistym używają własnej tury otwarcia strumienia w czasie rzeczywistym. Voice Call **nie** publikuje starszej aktualizacji TwiML `<Say>` dla tej początkowej wiadomości, więc sesje wychodzące `<Connect><Stream>` pozostają podłączone.

### Okres karencji rozłączenia strumienia Twilio

Gdy strumień mediów Twilio się rozłączy, Voice Call czeka **2000 ms** przed
automatycznym zakończeniem połączenia:

- Jeśli strumień połączy się ponownie w tym oknie, automatyczne zakończenie zostaje anulowane.
- Jeśli po okresie karencji żaden strumień nie zarejestruje się ponownie, połączenie zostaje zakończone, aby zapobiec zablokowanym aktywnym połączeniom.

## Czyszczenie nieaktualnych połączeń

Użyj `staleCallReaperSeconds`, aby kończyć połączenia, które nigdy nie otrzymują końcowego
Webhook (na przykład połączenia w trybie powiadomień, które nigdy się nie kończą). Wartość domyślna
to `0` (wyłączone).

Zalecane zakresy:

- **Produkcja:** `120`–`300` sekund dla przepływów typu powiadomienia.
- Utrzymuj tę wartość **wyżej niż `maxDurationSeconds`**, aby normalne połączenia mogły się zakończyć. Dobrym punktem wyjścia jest `maxDurationSeconds + 30–60` sekund.

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

Gdy proxy lub tunel znajduje się przed Gateway, plugin
rekonstruuje publiczny URL do weryfikacji podpisu. Te opcje
kontrolują, które przekazane nagłówki są zaufane:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Lista dozwolonych hostów z nagłówków przekazywania.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Ufaj przekazanym nagłówkom bez listy dozwolonych.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Ufaj przekazanym nagłówkom tylko wtedy, gdy zdalny adres IP żądania pasuje do listy.
</ParamField>

Dodatkowe zabezpieczenia:

- **Ochrona przed powtórzeniem** Webhook jest włączona dla Twilio i Plivo. Powtórzone poprawne żądania Webhook są potwierdzane, ale pomijane pod kątem skutków ubocznych.
- Tury rozmowy Twilio zawierają token dla każdej tury w wywołaniach zwrotnych `<Gather>`, więc nieaktualne/powtórzone wywołania zwrotne mowy nie mogą spełnić nowszej oczekującej tury transkrypcji.
- Nieuwierzytelnione żądania Webhook są odrzucane przed odczytem treści, gdy brakuje wymaganych nagłówków podpisu dostawcy.
- Webhook voice-call używa współdzielonego profilu treści przed uwierzytelnieniem (64 KB / 5 sekund) oraz limitu jednoczesnych żądań na IP przed weryfikacją podpisu.

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

Gdy Gateway już działa, operacyjne polecenia `voicecall` delegują
do środowiska uruchomieniowego połączeń głosowych należącego do Gateway, dzięki czemu CLI nie wiąże drugiego
serwera webhooków. Jeśli żaden Gateway nie jest osiągalny, polecenia wracają do
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

To repozytorium zawiera zgodny dokument Skills pod adresem `skills/voice-call/SKILL.md`.

## RPC Gateway

| Metoda               | Argumenty                                  |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` jest prawidłowe tylko z `mode: "conversation"`. Połączenia w trybie powiadamiania,
które potrzebują cyfr po nawiązaniu połączenia, powinny używać `voicecall.dtmf`
po utworzeniu połączenia.

## Rozwiązywanie problemów

### Konfiguracja nie udostępnia webhooka

Uruchom konfigurację z tego samego środowiska, w którym działa Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Dla `twilio`, `telnyx` i `plivo` stan `webhook-exposure` musi być zielony.
Skonfigurowane `publicUrl` nadal kończy się niepowodzeniem, gdy wskazuje lokalną lub prywatną przestrzeń sieciową,
ponieważ operator nie może wywołać tych adresów zwrotnie. Nie używaj
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` ani `fd00::/8` jako `publicUrl`.

Połączenia wychodzące Twilio w trybie powiadamiania wysyłają początkowy TwiML `<Say>` bezpośrednio w
żądaniu utworzenia połączenia, więc pierwsza wypowiadana wiadomość nie zależy od tego, czy Twilio
pobierze TwiML webhooka. Publiczny webhook jest nadal wymagany do wywołań zwrotnych statusu,
połączeń konwersacyjnych, DTMF przed połączeniem, strumieni czasu rzeczywistego i sterowania połączeniem
po nawiązaniu połączenia.

Użyj jednej publicznej ścieżki udostępniania:

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

Po zmianie konfiguracji uruchom ponownie lub przeładuj Gateway, a następnie uruchom:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` jest przebiegiem próbnym, chyba że przekażesz `--yes`.

### Dane uwierzytelniające dostawcy nie działają

Sprawdź wybranego dostawcę i wymagane pola danych uwierzytelniających:

- Twilio: `twilio.accountSid`, `twilio.authToken` i `fromNumber` albo
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` i `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` i
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` i `fromNumber`.

Dane uwierzytelniające muszą istnieć na hoście Gateway. Edycja lokalnego profilu powłoki
nie wpływa na już działający Gateway, dopóki nie zostanie on ponownie uruchomiony lub nie przeładuje
swojego środowiska.

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
- Zapora lub DNS kieruje publiczną nazwę hosta w inne miejsce niż Gateway.
- Gateway został ponownie uruchomiony bez włączonego Pluginu Voice Call.

Gdy przed Gateway znajduje się odwrotne proxy lub tunel, ustaw
`webhookSecurity.allowedHosts` na publiczną nazwę hosta albo użyj
`webhookSecurity.trustedProxyIPs` dla znanego adresu proxy. Używaj
`webhookSecurity.trustForwardingHeaders` tylko wtedy, gdy granica proxy jest pod
Twoją kontrolą.

### Weryfikacja podpisu nie działa

Podpisy dostawcy są sprawdzane względem publicznego URL-a, który OpenClaw rekonstruuje
z przychodzącego żądania. Jeśli podpisy nie przechodzą weryfikacji:

- Potwierdź, że URL webhooka dostawcy dokładnie odpowiada `publicUrl`, w tym
  schematowi, hostowi i ścieżce.
- W przypadku adresów URL ngrok w bezpłatnej warstwie zaktualizuj `publicUrl`, gdy zmieni się nazwa hosta tunelu.
- Upewnij się, że proxy zachowuje oryginalne nagłówki hosta i proto, albo skonfiguruj
  `webhookSecurity.allowedHosts`.
- Nie włączaj `skipSignatureVerification` poza testami lokalnymi.

### Dołączenia Google Meet przez Twilio nie działają

Google Meet używa tego Pluginu do dołączeń przez wybieranie numeru Twilio. Najpierw zweryfikuj Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Następnie jawnie zweryfikuj transport Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Jeśli Voice Call jest zielony, ale uczestnik Meet nigdy nie dołącza, sprawdź
numer telefoniczny Meet, PIN i `--dtmf-sequence`. Połączenie telefoniczne może być poprawne, podczas gdy
spotkanie odrzuca lub ignoruje nieprawidłową sekwencję DTMF.

Google Meet przekazuje sekwencję DTMF Meet i tekst wprowadzający do `voicecall.start`.
W przypadku połączeń Twilio Voice Call najpierw obsługuje TwiML DTMF, przekierowuje z powrotem do
webhooka, a następnie otwiera strumień multimediów czasu rzeczywistego, aby zapisane wprowadzenie zostało wygenerowane
po dołączeniu uczestnika telefonicznego do spotkania.

Użyj `openclaw logs --follow`, aby śledzić fazę na żywo. Poprawne dołączenie Twilio Meet
loguje tę kolejność:

- Google Meet deleguje dołączenie Twilio do Voice Call.
- Voice Call zapisuje TwiML DTMF przed połączeniem.
- Początkowy TwiML Twilio jest zużywany i obsługiwany przed obsługą czasu rzeczywistego.
- Voice Call obsługuje TwiML czasu rzeczywistego dla połączenia Twilio.
- Most czasu rzeczywistego uruchamia się z początkowym powitaniem w kolejce.

`openclaw voicecall tail` nadal pokazuje utrwalone rekordy połączeń; jest przydatne do
stanu połączeń i transkrypcji, ale nie każde przejście webhooka/czasu rzeczywistego
jest tam widoczne.

### Połączenie czasu rzeczywistego nie ma mowy

Potwierdź, że włączony jest tylko jeden tryb audio. `realtime.enabled` i
`streaming.enabled` nie mogą być jednocześnie ustawione na true.

W przypadku połączeń Twilio czasu rzeczywistego zweryfikuj także:

- Plugin dostawcy czasu rzeczywistego jest załadowany i zarejestrowany.
- `realtime.provider` jest nieustawione albo wskazuje zarejestrowanego dostawcę.
- Klucz API dostawcy jest dostępny dla procesu Gateway.
- `openclaw logs --follow` pokazuje obsłużony TwiML czasu rzeczywistego, uruchomiony most czasu rzeczywistego
  i początkowe powitanie dodane do kolejki.

## Powiązane

- [Tryb rozmowy](/pl/nodes/talk)
- [Zamiana tekstu na mowę](/pl/tools/tts)
- [Wybudzanie głosowe](/pl/nodes/voicewake)
