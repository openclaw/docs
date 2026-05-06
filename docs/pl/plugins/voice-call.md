---
read_when:
    - Chcesz nawiązać wychodzące połączenie głosowe za pomocą OpenClaw
    - Konfigurujesz lub rozwijasz Plugin do połączeń głosowych
    - Potrzebujesz obsługi głosu w czasie rzeczywistym lub strumieniowej transkrypcji w telefonii
sidebarTitle: Voice call
summary: Wykonuj połączenia głosowe wychodzące i odbieraj przychodzące przez Twilio, Telnyx lub Plivo, z opcjonalną obsługą głosu w czasie rzeczywistym i transkrypcją strumieniową
title: Plugin połączeń głosowych
x-i18n:
    generated_at: "2026-05-06T09:25:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: aba168696481ef0cc3c55ac8fd8be4382cb36889a12ed6d881fe6b29a2b0a54c
    source_path: plugins/voice-call.md
    workflow: 16
---

Połączenia głosowe dla OpenClaw przez Plugin. Obsługuje powiadomienia wychodzące,
rozmowy wieloturowe, pełnodupleksowy głos w czasie rzeczywistym, strumieniową
transkrypcję oraz połączenia przychodzące z zasadami listy dozwolonych.

**Obecni dostawcy:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (tryb deweloperski/brak sieci).

<Note>
Plugin Voice Call działa **wewnątrz procesu Gateway**. Jeśli używasz
zdalnego Gateway, zainstaluj i skonfiguruj Plugin na maszynie uruchamiającej
Gateway, a następnie zrestartuj Gateway, aby go załadować.
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
      <Tab title="Z folderu lokalnego (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Użyj samego pakietu, aby podążać za bieżącym oficjalnym tagiem wydania. Przypinaj
    dokładną wersję tylko wtedy, gdy potrzebujesz odtwarzalnej instalacji.

    Następnie zrestartuj Gateway, aby Plugin został załadowany.

  </Step>
  <Step title="Skonfiguruj dostawcę i Webhook">
    Ustaw konfigurację w `plugins.entries.voice-call.config` (pełny kształt
    opisano niżej w sekcji [Konfiguracja](#configuration)). Wymagane minimum:
    `provider`, dane uwierzytelniające dostawcy, `fromNumber` oraz publicznie
    dostępny URL Webhook.
  </Step>
  <Step title="Zweryfikuj konfigurację">
    ```bash
    openclaw voicecall setup
    ```

    Domyślne wyjście jest czytelne w logach czatu i terminalach. Sprawdza
    włączenie Plugin, dane uwierzytelniające dostawcy, ekspozycję Webhook oraz to,
    że aktywny jest tylko jeden tryb audio (`streaming` albo `realtime`). Użyj
    `--json` dla skryptów.

  </Step>
  <Step title="Test smoke">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Oba polecenia domyślnie są próbami bez faktycznego wykonania. Dodaj `--yes`, aby rzeczywiście wykonać krótkie
    wychodzące połączenie powiadamiające:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Dla Twilio, Telnyx i Plivo konfiguracja musi wskazywać **publiczny URL Webhook**.
Jeśli `publicUrl`, URL tunelu, URL Tailscale albo awaryjne udostępnianie
rozwiązuje się do local loopback lub przestrzeni sieci prywatnej, konfiguracja kończy się niepowodzeniem zamiast
uruchamiać dostawcę, który nie może odbierać Webhooków operatora.
</Warning>

## Konfiguracja

Jeśli `enabled: true`, ale wybranemu dostawcy brakuje danych uwierzytelniających,
podczas startu Gateway logowane jest ostrzeżenie o nieukończonej konfiguracji z brakującymi kluczami i
uruchomienie runtime jest pomijane. Polecenia, wywołania RPC i narzędzia agenta nadal
zwracają dokładnie brakującą konfigurację dostawcy podczas użycia.

<Note>
Dane uwierzytelniające voice-call akceptują SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` oraz `plugins.entries.voice-call.config.tts.providers.*.apiKey` są rozwiązywane przez standardową powierzchnię SecretRef; zobacz [powierzchnię danych uwierzytelniających SecretRef](/pl/reference/secretref-credential-surface).
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
    - Twilio, Telnyx i Plivo wymagają **publicznie dostępnego** URL Webhook.
    - `mock` to lokalny dostawca deweloperski (bez wywołań sieciowych).
    - Telnyx wymaga `telnyx.publicKey` (albo `TELNYX_PUBLIC_KEY`), chyba że `skipSignatureVerification` ma wartość true.
    - `skipSignatureVerification` jest przeznaczone tylko do testów lokalnych.
    - W darmowym planie ngrok ustaw `publicUrl` na dokładny URL ngrok; weryfikacja podpisu jest zawsze wymuszana.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` dopuszcza Webhooki Twilio z nieprawidłowymi podpisami **tylko** wtedy, gdy `tunnel.provider="ngrok"` i `serve.bind` to local loopback (lokalny agent ngrok). Tylko do lokalnego developmentu.
    - URL-e darmowego planu ngrok mogą się zmieniać lub dodawać ekran pośredni; jeśli `publicUrl` się rozjedzie, podpisy Twilio zawiodą. Produkcja: preferuj stabilną domenę albo Tailscale funnel.

  </Accordion>
  <Accordion title="Limity połączeń strumieniowych">
    - `streaming.preStartTimeoutMs` zamyka gniazda, które nigdy nie wysłały prawidłowej ramki `start`.
    - `streaming.maxPendingConnections` ogranicza łączną liczbę nieuwierzytelnionych gniazd przed startem.
    - `streaming.maxPendingConnectionsPerIp` ogranicza nieuwierzytelnione gniazda przed startem na źródłowy adres IP.
    - `streaming.maxConnections` ogranicza łączną liczbę otwartych gniazd strumienia mediów (oczekujące + aktywne).

  </Accordion>
  <Accordion title="Migracje starszej konfiguracji">
    Starsze konfiguracje używające `provider: "log"`, `twilio.from` lub starszych
    kluczy OpenAI `streaming.*` są przepisywane przez `openclaw doctor --fix`.
    Awaryjna ścieżka runtime nadal na razie akceptuje stare klucze voice-call, ale
    ścieżką przepisywania jest `openclaw doctor --fix`, a warstwa kompatybilności jest
    tymczasowa.

    Automatycznie migrowane klucze strumieniowe:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Zakres sesji

Domyślnie Voice Call używa `sessionScope: "per-phone"`, aby powtarzane połączenia od
tego samego dzwoniącego zachowywały pamięć rozmowy. Ustaw `sessionScope: "per-call"`, gdy
każde połączenie operatora powinno zaczynać ze świeżym kontekstem, na przykład w recepcji,
rezerwacjach, IVR lub przepływach mostka Google Meet, gdzie ten sam numer telefonu może
reprezentować różne spotkania.

## Rozmowy głosowe w czasie rzeczywistym

`realtime` wybiera pełnodupleksowego dostawcę głosu w czasie rzeczywistym dla audio
połączeń na żywo. Jest oddzielne od `streaming`, które tylko przekazuje audio do
dostawców transkrypcji w czasie rzeczywistym.

<Warning>
`realtime.enabled` nie można łączyć z `streaming.enabled`. Wybierz jeden
tryb audio na połączenie.
</Warning>

Bieżące zachowanie runtime:

- `realtime.enabled` jest obsługiwane dla Twilio Media Streams.
- `realtime.provider` jest opcjonalne. Jeśli nie jest ustawione, Voice Call używa pierwszego zarejestrowanego dostawcy głosu w czasie rzeczywistym.
- Dołączeni dostawcy głosu w czasie rzeczywistym: Google Gemini Live (`google`) i OpenAI (`openai`), rejestrowani przez ich dostawców Plugin.
- Surowa konfiguracja należąca do dostawcy znajduje się w `realtime.providers.<providerId>`.
- Voice Call domyślnie udostępnia współdzielone narzędzie czasu rzeczywistego `openclaw_agent_consult`. Model czasu rzeczywistego może je wywołać, gdy dzwoniący prosi o głębsze rozumowanie, aktualne informacje lub zwykłe narzędzia OpenClaw.
- `realtime.consultPolicy` opcjonalnie dodaje wskazówki, kiedy model czasu rzeczywistego powinien wywołać `openclaw_agent_consult`.
- `realtime.agentContext.enabled` jest domyślnie wyłączone. Po włączeniu Voice Call wstrzykuje ograniczoną tożsamość agenta, nadpisanie promptu systemowego oraz wybraną kapsułę plików workspace do instrukcji dostawcy czasu rzeczywistego podczas konfiguracji sesji.
- `realtime.fastContext.enabled` jest domyślnie wyłączone. Po włączeniu Voice Call najpierw przeszukuje zaindeksowaną pamięć/kontekst sesji dla pytania konsultacyjnego i zwraca te fragmenty do modelu czasu rzeczywistego w czasie `realtime.fastContext.timeoutMs`, zanim wróci do pełnego agenta konsultacyjnego tylko wtedy, gdy `realtime.fastContext.fallbackToConsult` ma wartość true.
- Jeśli `realtime.provider` wskazuje niezarejestrowanego dostawcę albo nie zarejestrowano żadnego dostawcy głosu w czasie rzeczywistym, Voice Call loguje ostrzeżenie i pomija media w czasie rzeczywistym zamiast powodować awarię całego Plugin.
- Klucze sesji konsultacji ponownie używają zapisanej sesji połączenia, gdy jest dostępna, a następnie wracają do skonfigurowanego `sessionScope` (`per-phone` domyślnie albo `per-call` dla izolowanych połączeń).

### Zasady narzędzi

`realtime.toolPolicy` kontroluje uruchomienie konsultacji:

| Zasada           | Zachowanie                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Udostępnia narzędzie konsultacji i ogranicza zwykłego agenta do `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` i `memory_get`. |
| `owner`          | Udostępnia narzędzie konsultacji i pozwala zwykłemu agentowi używać normalnych zasad narzędzi agenta.                                                      |
| `none`           | Nie udostępnia narzędzia konsultacji. Niestandardowe `realtime.tools` nadal są przekazywane do dostawcy czasu rzeczywistego.                               |

`realtime.consultPolicy` kontroluje tylko instrukcje modelu czasu rzeczywistego:

| Zasada        | Wskazówki                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | Zachowuje domyślny prompt i pozwala dostawcy zdecydować, kiedy wywołać narzędzie konsultacji.              |
| `substantive` | Odpowiada bezpośrednio na proste elementy spajające rozmowę i konsultuje się przed faktami, pamięcią, narzędziami lub kontekstem. |
| `always`      | Konsultuje się przed każdą merytoryczną odpowiedzią.                                                        |

### Kontekst głosowy agenta

Włącz `realtime.agentContext`, gdy mostek głosowy powinien brzmieć jak
skonfigurowany agent OpenClaw bez ponoszenia kosztu pełnej rundy agent-consult przy
zwykłych turach. Kapsuła kontekstu jest dodawana raz podczas tworzenia sesji czasu rzeczywistego,
więc nie dodaje opóźnienia na turę. Wywołania
`openclaw_agent_consult` nadal uruchamiają pełnego agenta OpenClaw i powinny być używane
do pracy z narzędziami, aktualnych informacji, wyszukiwania w pamięci lub stanu workspace.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          agentId: "main",
          realtime: {
            enabled: true,
            provider: "google",
            toolPolicy: "safe-read-only",
            consultPolicy: "substantive",
            agentContext: {
              enabled: true,
              maxChars: 6000,
              includeIdentity: true,
              includeSystemPrompt: true,
              includeWorkspaceFiles: true,
              files: ["SOUL.md", "IDENTITY.md", "USER.md"],
            },
          },
        },
      },
    },
  },
}
```

### Przykłady dostawców czasu rzeczywistego

<Tabs>
  <Tab title="Google Gemini Live">
    Domyślnie: klucz API z `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` lub `GOOGLE_GENERATIVE_AI_API_KEY`; model
    `gemini-2.5-flash-native-audio-preview-12-2025`; głos `Kore`.
    `sessionResumption` i `contextWindowCompression` są domyślnie włączone dla dłuższych,
    wznawialnych połączeń. Użyj `silenceDurationMs`, `startSensitivity` i
    `endSensitivity`, aby dostroić szybsze przejmowanie tury w dźwięku telefonicznym.

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
                consultPolicy: "substantive",
                agentContext: { enabled: true },
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

Zobacz [dostawcę Google](/pl/providers/google) oraz
[dostawcę OpenAI](/pl/providers/openai), aby poznać opcje głosu w czasie rzeczywistym
specyficzne dla dostawcy.

## Transkrypcja strumieniowa

`streaming` wybiera dostawcę transkrypcji w czasie rzeczywistym dla dźwięku połączenia na żywo.

Bieżące zachowanie środowiska uruchomieniowego:

- `streaming.provider` jest opcjonalne. Jeśli nie jest ustawione, Voice Call używa pierwszego zarejestrowanego dostawcy transkrypcji w czasie rzeczywistym.
- Dołączeni dostawcy transkrypcji w czasie rzeczywistym: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) i xAI (`xai`), rejestrowani przez ich dostawcze Pluginy.
- Surowa konfiguracja należąca do dostawcy znajduje się w `streaming.providers.<providerId>`.
- Po wysłaniu przez Twilio zaakceptowanej wiadomości `start` strumienia Voice Call natychmiast rejestruje strumień, kolejkuje przychodzące media przez dostawcę transkrypcji podczas łączenia dostawcy i uruchamia początkowe powitanie dopiero wtedy, gdy transkrypcja w czasie rzeczywistym jest gotowa.
- Jeśli `streaming.provider` wskazuje niezarejestrowanego dostawcę albo żaden nie jest zarejestrowany, Voice Call zapisuje ostrzeżenie w logu i pomija strumieniowanie mediów zamiast powodować awarię całego Pluginu.

### Przykłady dostawców strumieniowania

<Tabs>
  <Tab title="OpenAI">
    Domyślnie: klucz API `streaming.providers.openai.apiKey` lub
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
    Domyślnie: klucz API `streaming.providers.xai.apiKey` lub `XAI_API_KEY`;
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
mowy w połączeniach. Możesz ją nadpisać w konfiguracji Pluginu przy użyciu
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

- Starsze klucze `tts.<provider>` w konfiguracji Pluginu (`openai`, `elevenlabs`, `microsoft`, `edge`) są naprawiane przez `openclaw doctor --fix`; zatwierdzona konfiguracja powinna używać `tts.providers.<provider>`.
- Podstawowy TTS jest używany, gdy strumieniowanie mediów Twilio jest włączone; w przeciwnym razie połączenia wracają do głosów natywnych dla dostawcy.
- Jeśli strumień mediów Twilio jest już aktywny, Voice Call nie wraca do TwiML `<Say>`. Jeśli telefoniczny TTS jest w tym stanie niedostępny, żądanie odtwarzania kończy się niepowodzeniem zamiast mieszać dwie ścieżki odtwarzania.
- Gdy telefoniczny TTS przełącza się awaryjnie na dostawcę pomocniczego, Voice Call zapisuje ostrzeżenie z łańcuchem dostawców (`from`, `to`, `attempts`) do debugowania.
- Gdy barge-in Twilio lub rozłączenie strumienia czyści oczekującą kolejkę TTS, zakolejkowane żądania odtwarzania zostają rozstrzygnięte zamiast pozostawiać dzwoniących oczekujących na zakończenie odtwarzania.

### Przykłady TTS

<Tabs>
  <Tab title="Core TTS only">
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
  <Tab title="Override to ElevenLabs (calls only)">
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
  <Tab title="OpenAI model override (deep-merge)">
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

Polityka połączeń przychodzących domyślnie ma wartość `disabled`. Aby włączyć połączenia przychodzące, ustaw:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` to ekran identyfikacji numeru dzwoniącego o niskiej pewności. Plugin
normalizuje dostarczoną przez dostawcę wartość `From` i porównuje ją z
`allowFrom`. Weryfikacja Webhooka uwierzytelnia dostarczenie przez dostawcę i
integralność ładunku, ale **nie** potwierdza własności numeru dzwoniącego
PSTN/VoIP. Traktuj `allowFrom` jako filtrowanie identyfikacji numeru dzwoniącego, a nie silną
tożsamość dzwoniącego.
</Warning>

Automatyczne odpowiedzi używają systemu agentów. Dostosuj je za pomocą `responseModel`,
`responseSystemPrompt` i `responseTimeoutMs`.

### Routing według numeru

Użyj `numbers`, gdy jeden Plugin Voice Call odbiera połączenia dla wielu numerów
telefonu i każdy numer powinien zachowywać się jak inna linia. Na przykład jeden
numer może używać swobodnego osobistego asystenta, a inny persony biznesowej,
innego agenta odpowiedzi i innego głosu TTS.

Trasy są wybierane na podstawie dostarczonego przez dostawcę wybieranego numeru `To`. Klucze muszą być
numerami E.164. Gdy połączenie nadejdzie, Voice Call jednorazowo rozwiązuje pasującą trasę,
zapisuje dopasowaną trasę w rekordzie połączenia i ponownie używa tej efektywnej konfiguracji
dla powitania, klasycznej ścieżki automatycznej odpowiedzi, ścieżki konsultacji w czasie rzeczywistym oraz
odtwarzania TTS. Jeśli żadna trasa nie pasuje, używana jest globalna konfiguracja Voice Call.
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

Dla automatycznych odpowiedzi Voice Call dołącza ścisły kontrakt wyjścia mówionego do
promptu systemowego:

```text
{"spoken":"..."}
```

Voice Call defensywnie wyodrębnia tekst mowy:

- Ignoruje ładunki oznaczone jako treść rozumowania/błędu.
- Parsuje bezpośredni JSON, JSON w bloku kodu lub wbudowane klucze `"spoken"`.
- Wraca do zwykłego tekstu i usuwa prawdopodobne akapity wprowadzające dotyczące planowania/metadanych.

Dzięki temu odtwarzanie mowy pozostaje skupione na tekście kierowanym do dzwoniącego i unika
wyciekania tekstu planowania do dźwięku.

### Zachowanie uruchamiania rozmowy

Dla wychodzących połączeń `conversation` obsługa pierwszej wiadomości jest powiązana ze stanem odtwarzania
na żywo:

- Czyszczenie kolejki barge-in i automatyczna odpowiedź są wstrzymywane tylko wtedy, gdy początkowe powitanie jest aktywnie wypowiadane.
- Jeśli początkowe odtwarzanie się nie powiedzie, połączenie wraca do stanu `listening`, a początkowa wiadomość pozostaje w kolejce do ponowienia.
- Początkowe odtwarzanie dla strumieniowania Twilio zaczyna się po połączeniu strumienia bez dodatkowego opóźnienia.
- Barge-in przerywa aktywne odtwarzanie i czyści zakolejkowane, ale jeszcze nieodtwarzane wpisy Twilio TTS. Wyczyszczone wpisy rozstrzygają się jako pominięte, dzięki czemu dalsza logika odpowiedzi może kontynuować bez oczekiwania na dźwięk, który nigdy nie zostanie odtworzony.
- Rozmowy głosowe w czasie rzeczywistym używają własnej tury otwierającej strumienia czasu rzeczywistego. Voice Call **nie** publikuje starszej aktualizacji TwiML `<Say>` dla tej początkowej wiadomości, więc wychodzące sesje `<Connect><Stream>` pozostają podłączone.

### Okres karencji rozłączenia strumienia Twilio

Gdy strumień mediów Twilio się rozłącza, Voice Call czeka **2000 ms** przed
automatycznym zakończeniem połączenia:

- Jeśli strumień połączy się ponownie w tym oknie, automatyczne zakończenie zostaje anulowane.
- Jeśli po okresie karencji żaden strumień nie zarejestruje się ponownie, połączenie zostaje zakończone, aby zapobiec utknięciu aktywnych połączeń.

## Mechanizm usuwania nieaktualnych połączeń

Użyj `staleCallReaperSeconds`, aby kończyć połączenia, które nigdy nie otrzymują końcowego
Webhooka (na przykład połączenia w trybie powiadomień, które nigdy się nie kończą). Domyślna wartość
to `0` (wyłączone).

Zalecane zakresy:

- **Produkcja:** `120`–`300` sekund dla przepływów typu powiadomienie.
- Utrzymuj tę wartość **wyższą niż `maxDurationSeconds`**, aby normalne wywołania mogły się zakończyć. Dobrym punktem wyjścia jest `maxDurationSeconds + 30–60` sekund.

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
odtwarza publiczny URL do weryfikacji podpisu. Te opcje
kontrolują, którym przekazywanym nagłówkom można ufać:

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

- **Ochrona przed ponownym odtworzeniem Webhook** jest włączona dla Twilio i Plivo. Ponownie odtworzone prawidłowe żądania Webhook są potwierdzane, ale pomijane pod kątem skutków ubocznych.
- Tury rozmowy Twilio zawierają token dla danej tury w wywołaniach zwrotnych `<Gather>`, więc nieaktualne/ponownie odtworzone wywołania zwrotne mowy nie mogą spełnić nowszej oczekującej tury transkrypcji.
- Nieuwierzytelnione żądania Webhook są odrzucane przed odczytem treści, gdy brakuje wymaganych przez dostawcę nagłówków podpisu.
- Webhook voice-call używa współdzielonego profilu treści przed uwierzytelnieniem (64 KB / 5 sekund) oraz limitu równoległych żądań na adres IP przed weryfikacją podpisu.

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
do środowiska uruchomieniowego voice-call należącego do Gateway, aby CLI nie wiązało drugiego
serwera Webhook. Jeśli żaden Gateway nie jest osiągalny, polecenia przechodzą na
samodzielne środowisko uruchomieniowe CLI.

`latency` odczytuje `calls.jsonl` z domyślnej ścieżki przechowywania voice-call.
Użyj `--file <path>`, aby wskazać inny dziennik, oraz `--last <n>`, aby ograniczyć
analizę do ostatnich N rekordów (domyślnie 200). Wynik obejmuje p50/p90/p99
dla opóźnień tur oraz czasów oczekiwania na nasłuchiwanie.

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

To repozytorium dostarcza zgodny dokument skill pod adresem `skills/voice-call/SKILL.md`.

## RPC Gateway

| Metoda               | Argumenty                                  |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` jest prawidłowe tylko z `mode: "conversation"`. Wywołania w trybie powiadomienia
powinny używać `voicecall.dtmf` po utworzeniu połączenia, jeśli potrzebują cyfr
po połączeniu.

## Rozwiązywanie problemów

### Konfiguracja nie może wystawić Webhook

Uruchom konfigurację z tego samego środowiska, w którym działa Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Dla `twilio`, `telnyx` i `plivo` `webhook-exposure` musi być zielone. Skonfigurowany
`publicUrl` nadal kończy się niepowodzeniem, gdy wskazuje lokalną lub prywatną przestrzeń
sieciową, ponieważ operator nie może wywołać zwrotnie tych adresów. Nie używaj
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` ani `fd00::/8` jako `publicUrl`.

Wychodzące połączenia Twilio w trybie powiadomienia wysyłają początkowy TwiML `<Say>` bezpośrednio w
żądaniu utworzenia połączenia, więc pierwsza wypowiadana wiadomość nie zależy od tego, czy Twilio
pobierze TwiML z Webhook. Publiczny Webhook nadal jest wymagany dla wywołań zwrotnych statusu,
połączeń konwersacyjnych, DTMF przed połączeniem, strumieni czasu rzeczywistego i sterowania połączeniem
po połączeniu.

Użyj jednej ścieżki publicznego wystawienia:

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

`voicecall smoke` jest suchym przebiegiem, chyba że przekażesz `--yes`.

### Dane uwierzytelniające dostawcy zawodzą

Sprawdź wybranego dostawcę i wymagane pola danych uwierzytelniających:

- Twilio: `twilio.accountSid`, `twilio.authToken` i `fromNumber` albo
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` i `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` i
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` i `fromNumber`.

Dane uwierzytelniające muszą istnieć na hoście Gateway. Edycja lokalnego profilu powłoki nie
wpływa na już działający Gateway, dopóki nie zostanie uruchomiony ponownie lub nie przeładuje
swojego środowiska.

### Połączenia startują, ale Webhook dostawcy nie przychodzą

Potwierdź, że konsola dostawcy wskazuje dokładny publiczny URL Webhook:

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
- Gateway został uruchomiony ponownie bez włączonego Plugin Voice Call.

Gdy przed Gateway znajduje się odwrotne proxy lub tunel, ustaw
`webhookSecurity.allowedHosts` na publiczną nazwę hosta albo użyj
`webhookSecurity.trustedProxyIPs` dla znanego adresu proxy. Używaj
`webhookSecurity.trustForwardingHeaders` tylko wtedy, gdy granica proxy jest pod
Twoją kontrolą.

### Weryfikacja podpisu kończy się niepowodzeniem

Podpisy dostawcy są sprawdzane względem publicznego URL, który OpenClaw odtwarza
z przychodzącego żądania. Jeśli podpisy zawodzą:

- Potwierdź, że URL Webhook dostawcy dokładnie pasuje do `publicUrl`, w tym
  schemat, host i ścieżkę.
- W przypadku URL-i bezpłatnego poziomu ngrok zaktualizuj `publicUrl`, gdy zmieni się nazwa hosta tunelu.
- Upewnij się, że proxy zachowuje oryginalne nagłówki hosta i protokołu, albo skonfiguruj
  `webhookSecurity.allowedHosts`.
- Nie włączaj `skipSignatureVerification` poza testami lokalnymi.

### Dołączenia Google Meet przez Twilio zawodzą

Google Meet używa tego Plugin do dołączeń przez numer telefoniczny Twilio. Najpierw zweryfikuj Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Następnie zweryfikuj transport Google Meet jawnie:

```bash
openclaw googlemeet setup --transport twilio
```

Jeśli Voice Call jest zielony, ale uczestnik Meet nigdy nie dołącza, sprawdź numer
dial-in Meet, PIN i `--dtmf-sequence`. Połączenie telefoniczne może być zdrowe, podczas gdy
spotkanie odrzuca lub ignoruje nieprawidłową sekwencję DTMF.

Google Meet rozpoczyna telefoniczną nogę Twilio przez `voicecall.start` z
sekwencją DTMF przed połączeniem. Sekwencje pochodzące z PIN-u zawierają
`voiceCall.dtmfDelayMs` Plugin Google Meet jako początkowe cyfry oczekiwania Twilio. Domyślnie jest to 12 sekund,
ponieważ komunikaty dial-in Meet mogą nadejść późno. Następnie Voice Call przekierowuje z powrotem do
obsługi czasu rzeczywistego przed zażądaniem powitania wstępnego.

Użyj `openclaw logs --follow` dla śledzenia fazy na żywo. Zdrowe dołączenie Twilio Meet
rejestruje tę kolejność:

- Google Meet deleguje dołączenie Twilio do Voice Call.
- Voice Call zapisuje TwiML DTMF przed połączeniem.
- Początkowy TwiML Twilio jest zużywany i serwowany przed obsługą czasu rzeczywistego.
- Voice Call serwuje TwiML czasu rzeczywistego dla połączenia Twilio.
- Google Meet żąda mowy wstępnej przez `voicecall.speak` po opóźnieniu po DTMF.

`openclaw voicecall tail` nadal pokazuje utrwalone rekordy połączeń; jest przydatne do
stanu połączenia i transkrypcji, ale nie każde przejście Webhook/czasu rzeczywistego pojawia się
tam.

### Połączenie czasu rzeczywistego nie ma mowy

Potwierdź, że włączony jest tylko jeden tryb audio. `realtime.enabled` i
`streaming.enabled` nie mogą być jednocześnie true.

Dla połączeń Twilio czasu rzeczywistego zweryfikuj także:

- Plugin dostawcy czasu rzeczywistego jest załadowany i zarejestrowany.
- `realtime.provider` jest nieustawione albo wskazuje zarejestrowanego dostawcę.
- Klucz API dostawcy jest dostępny dla procesu Gateway.
- `openclaw logs --follow` pokazuje zaserwowany TwiML czasu rzeczywistego, uruchomiony most czasu rzeczywistego
  i zakolejkowane początkowe powitanie.

## Powiązane

- [Tryb rozmowy](/pl/nodes/talk)
- [Tekst na mowę](/pl/tools/tts)
- [Wybudzanie głosem](/pl/nodes/voicewake)
