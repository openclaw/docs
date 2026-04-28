---
read_when:
    - Chcesz wykonać wychodzące połączenie głosowe z OpenClaw
    - Konfigurujesz lub tworzysz plugin voice-call
    - Potrzebujesz głosu w czasie rzeczywistym lub transkrypcji strumieniowej w telefonii
sidebarTitle: Voice call
summary: Wykonuj połączenia głosowe wychodzące i odbieraj przychodzące przez Twilio, Telnyx lub Plivo, z opcjonalnym głosem w czasie rzeczywistym i transkrypcją strumieniową
title: Plugin połączeń głosowych
x-i18n:
    generated_at: "2026-04-26T11:38:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77b5e4b338b0c39c71accea7065af70fab695c8f34488ba0fbf7023f2f36f377
    source_path: plugins/voice-call.md
    workflow: 15
---

Połączenia głosowe dla OpenClaw przez plugin. Obsługuje powiadomienia wychodzące,
wieloturowe rozmowy, pełnodupleksowy głos w czasie rzeczywistym, transkrypcję
strumieniową oraz połączenia przychodzące z zasadami listy dozwolonych.

**Obecni dostawcy:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + transfer XML + mowa GetInput),
`mock` (deweloperski/bez sieci).

<Note>
Plugin Voice Call działa **wewnątrz procesu Gateway**. Jeśli używasz
zdalnego Gateway, zainstaluj i skonfiguruj plugin na maszynie, na której działa
Gateway, a następnie uruchom ponownie Gateway, aby załadować plugin.
</Note>

## Szybki start

<Steps>
  <Step title="Zainstaluj plugin">
    <Tabs>
      <Tab title="Z npm (zalecane)">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="Z lokalnego folderu (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Następnie uruchom ponownie Gateway, aby plugin został załadowany.

  </Step>
  <Step title="Skonfiguruj dostawcę i Webhook">
    Ustaw konfigurację w `plugins.entries.voice-call.config` (zobacz
    [Konfiguracja](#configuration) poniżej, aby poznać pełny kształt). Minimum to:
    `provider`, dane uwierzytelniające dostawcy, `fromNumber` oraz publicznie
    osiągalny adres URL Webhook.
  </Step>
  <Step title="Zweryfikuj konfigurację">
    ```bash
    openclaw voicecall setup
    ```

    Domyślne wyjście jest czytelne w logach czatu i terminalach. Sprawdza
    włączenie pluginu, dane uwierzytelniające dostawcy, ekspozycję Webhook i to,
    że aktywny jest tylko jeden tryb audio (`streaming` lub `realtime`). Użyj
    `--json` w skryptach.

  </Step>
  <Step title="Test smoke">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Oba polecenia są domyślnie wykonywane na sucho. Dodaj `--yes`, aby rzeczywiście
    wykonać krótkie wychodzące połączenie powiadamiające:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
W przypadku Twilio, Telnyx i Plivo konfiguracja musi wskazywać **publiczny adres URL Webhook**.
Jeśli `publicUrl`, adres URL tunelu, adres URL Tailscale lub zapasowy adres serwowania
wskazuje na local loopback albo prywatną przestrzeń sieciową, konfiguracja kończy się
niepowodzeniem zamiast uruchamiać dostawcę, który nie może odbierać Webhooków operatora.
</Warning>

## Konfiguracja

Jeśli `enabled: true`, ale wybranemu dostawcy brakuje danych uwierzytelniających,
log uruchamiania Gateway zapisuje ostrzeżenie o niekompletnej konfiguracji z brakującymi kluczami
i pomija uruchomienie środowiska uruchomieniowego. Polecenia, wywołania RPC i narzędzia agenta
nadal zwracają dokładnie brakującą konfigurację dostawcy podczas użycia.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // lub "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // lub TWILIO_FROM_NUMBER dla Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Klucz publiczny Webhook Telnyx z Mission Control Portal
            // (Base64; można też ustawić przez TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },
          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Serwer Webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Zabezpieczenia Webhook (zalecane dla tuneli/proxy)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Ekspozycja publiczna (wybierz jedną)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* zobacz Transkrypcja strumieniowa */ },
          realtime: { enabled: false /* zobacz Głos w czasie rzeczywistym */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Uwagi dotyczące ekspozycji i bezpieczeństwa dostawców">
    - Twilio, Telnyx i Plivo wymagają **publicznie osiągalnego** adresu URL Webhook.
    - `mock` to lokalny dostawca deweloperski (bez wywołań sieciowych).
    - Telnyx wymaga `telnyx.publicKey` (lub `TELNYX_PUBLIC_KEY`), chyba że `skipSignatureVerification` ma wartość true.
    - `skipSignatureVerification` służy wyłącznie do testów lokalnych.
    - W darmowym planie ngrok ustaw `publicUrl` na dokładny adres URL ngrok; weryfikacja podpisu jest zawsze wymuszana.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` pozwala na Webhooki Twilio z nieprawidłowymi podpisami **tylko** gdy `tunnel.provider="ngrok"` i `serve.bind` wskazuje local loopback (lokalny agent ngrok). Tylko lokalny dev.
    - Adresy URL darmowego planu ngrok mogą się zmieniać lub dodawać zachowanie pośrednie; jeśli `publicUrl` przestanie być aktualny, podpisy Twilio będą błędne. W środowisku produkcyjnym preferuj stabilną domenę lub funnel Tailscale.

  </Accordion>
  <Accordion title="Limity połączeń strumieniowych">
    - `streaming.preStartTimeoutMs` zamyka gniazda, które nigdy nie wysyłają prawidłowej ramki `start`.
    - `streaming.maxPendingConnections` ogranicza łączną liczbę nieuwierzytelnionych gniazd przed startem.
    - `streaming.maxPendingConnectionsPerIp` ogranicza liczbę nieuwierzytelnionych gniazd przed startem na adres IP źródła.
    - `streaming.maxConnections` ogranicza łączną liczbę otwartych gniazd strumienia mediów (oczekujące + aktywne).

  </Accordion>
  <Accordion title="Migracje starszej konfiguracji">
    Starsze konfiguracje używające `provider: "log"`, `twilio.from` lub starszych
    kluczy OpenAI `streaming.*` są przepisywane przez `openclaw doctor --fix`.
    Fallback środowiska uruchomieniowego nadal tymczasowo akceptuje stare klucze voice-call,
    ale ścieżką przepisywania jest `openclaw doctor --fix`, a shim zgodności jest
    tymczasowy.

    Automatycznie migrowane klucze streamingu:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Rozmowy głosowe w czasie rzeczywistym

`realtime` wybiera pełnodupleksowego dostawcę głosu w czasie rzeczywistym dla dźwięku
połączeń na żywo. Jest to oddzielne od `streaming`, które przekazuje dźwięk tylko do
dostawców transkrypcji w czasie rzeczywistym.

<Warning>
`realtime.enabled` nie może być łączone z `streaming.enabled`. Wybierz jeden
tryb audio na połączenie.
</Warning>

Obecne zachowanie środowiska uruchomieniowego:

- `realtime.enabled` jest obsługiwane dla Twilio Media Streams.
- `realtime.provider` jest opcjonalne. Jeśli nie jest ustawione, Voice Call używa pierwszego zarejestrowanego dostawcy głosu w czasie rzeczywistym.
- Dołączeni dostawcy głosu w czasie rzeczywistym: Google Gemini Live (`google`) i OpenAI (`openai`), rejestrowani przez ich pluginy dostawców.
- Surowa konfiguracja należąca do dostawcy znajduje się w `realtime.providers.<providerId>`.
- Voice Call domyślnie udostępnia współdzielone narzędzie czasu rzeczywistego `openclaw_agent_consult`. Model czasu rzeczywistego może je wywołać, gdy dzwoniący potrzebuje głębszego rozumowania, aktualnych informacji lub zwykłych narzędzi OpenClaw.
- Jeśli `realtime.provider` wskazuje niezarejestrowanego dostawcę lub w ogóle nie jest zarejestrowany żaden dostawca głosu w czasie rzeczywistym, Voice Call zapisuje ostrzeżenie i pomija media czasu rzeczywistego zamiast powodować błąd całego pluginu.
- Klucze sesji konsultacji ponownie wykorzystują istniejącą sesję głosową, jeśli jest dostępna, a w przeciwnym razie wracają do numeru telefonu dzwoniącego/odbiorcy, aby kolejne wywołania konsultacji zachowywały kontekst podczas połączenia.

### Zasady narzędzi

`realtime.toolPolicy` kontroluje przebieg konsultacji:

| Zasada           | Zachowanie                                                                                                                                |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Udostępnia narzędzie konsultacji i ogranicza zwykłego agenta do `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` i `memory_get`. |
| `owner`          | Udostępnia narzędzie konsultacji i pozwala zwykłemu agentowi używać normalnych zasad narzędzi agenta.                                   |
| `none`           | Nie udostępnia narzędzia konsultacji. Niestandardowe `realtime.tools` są nadal przekazywane do dostawcy czasu rzeczywistego.            |

### Przykłady dostawców czasu rzeczywistego

<Tabs>
  <Tab title="Google Gemini Live">
    Wartości domyślne: klucz API z `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` lub `GOOGLE_GENERATIVE_AI_API_KEY`; model
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

Zobacz [Google provider](/pl/providers/google) i
[OpenAI provider](/pl/providers/openai), aby poznać opcje głosu w czasie rzeczywistym
specyficzne dla dostawców.

## Transkrypcja strumieniowa

`streaming` wybiera dostawcę transkrypcji w czasie rzeczywistym dla dźwięku połączeń na żywo.

Obecne zachowanie środowiska uruchomieniowego:

- `streaming.provider` jest opcjonalne. Jeśli nie jest ustawione, Voice Call używa pierwszego zarejestrowanego dostawcy transkrypcji w czasie rzeczywistym.
- Dołączeni dostawcy transkrypcji w czasie rzeczywistym: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) i xAI (`xai`), rejestrowani przez ich pluginy dostawców.
- Surowa konfiguracja należąca do dostawcy znajduje się w `streaming.providers.<providerId>`.
- Jeśli `streaming.provider` wskazuje niezarejestrowanego dostawcę lub żaden nie jest zarejestrowany, Voice Call zapisuje ostrzeżenie i pomija strumieniowanie mediów zamiast powodować błąd całego pluginu.

### Przykłady dostawców streamingu

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
                    apiKey: "sk-...", // opcjonalne, jeśli ustawiono OPENAI_API_KEY
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
    endpoint `wss://api.x.ai/v1/stt`; kodowanie `mulaw`; częstotliwość próbkowania `8000`;
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
                    apiKey: "${XAI_API_KEY}", // opcjonalne, jeśli ustawiono XAI_API_KEY
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

Voice Call używa konfiguracji `messages.tts` rdzenia do strumieniowania
mowy w połączeniach. Możesz ją nadpisać w konfiguracji pluginu z użyciem
**tego samego kształtu** — jest głęboko scalana z `messages.tts`.

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
**Microsoft speech jest ignorowane w połączeniach głosowych.** Dźwięk telefoniczny wymaga PCM;
obecny transport Microsoft nie udostępnia wyjścia PCM dla telefonii.
</Warning>

Uwagi dotyczące zachowania:

- Starsze klucze `tts.<provider>` w konfiguracji pluginu (`openai`, `elevenlabs`, `microsoft`, `edge`) są naprawiane przez `openclaw doctor --fix`; zatwierdzona konfiguracja powinna używać `tts.providers.<provider>`.
- TTS rdzenia jest używane, gdy włączone jest strumieniowanie mediów Twilio; w przeciwnym razie połączenia wracają do natywnych głosów dostawcy.
- Jeśli strumień mediów Twilio jest już aktywny, Voice Call nie wraca do TwiML `<Say>`. Jeśli TTS telefoniczne jest niedostępne w tym stanie, żądanie odtwarzania kończy się błędem zamiast mieszać dwie ścieżki odtwarzania.
- Gdy TTS telefoniczne wraca do pomocniczego dostawcy, Voice Call zapisuje ostrzeżenie z łańcuchem dostawców (`from`, `to`, `attempts`) na potrzeby debugowania.
- Gdy barging-in Twilio lub zamknięcie strumienia czyści oczekującą kolejkę TTS, zakolejkowane żądania odtwarzania są rozliczane zamiast pozostawiać dzwoniących oczekujących na zakończenie odtwarzania.

### Przykłady TTS

<Tabs>
  <Tab title="Tylko TTS rdzenia">
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

Domyślną wartością zasad połączeń przychodzących jest `disabled`. Aby włączyć połączenia przychodzące, ustaw:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` to mechanizm filtrowania identyfikatora dzwoniącego o niskim poziomie pewności. Plugin
normalizuje wartość `From` dostarczoną przez dostawcę i porównuje ją z
`allowFrom`. Weryfikacja Webhook uwierzytelnia dostarczenie przez dostawcę i
integralność ładunku, ale **nie** potwierdza własności numeru dzwoniącego PSTN/VoIP.
Traktuj `allowFrom` jako filtrowanie identyfikatora dzwoniącego, a nie silną
tożsamość rozmówcy.
</Warning>

Automatyczne odpowiedzi korzystają z systemu agenta. Dostosuj je za pomocą `responseModel`,
`responseSystemPrompt` i `responseTimeoutMs`.

### Kontrakt wypowiedzi głosowej

Dla automatycznych odpowiedzi Voice Call dołącza do promptu systemowego
ścisły kontrakt wypowiedzi głosowej:

```text
{"spoken":"..."}
```

Voice Call defensywnie wyodrębnia tekst mowy:

- Ignoruje ładunki oznaczone jako treść rozumowania/błędu.
- Parsuje bezpośredni JSON, JSON w blokach fenced lub wbudowane klucze `"spoken"`.
- Wraca do zwykłego tekstu i usuwa prawdopodobne akapity wprowadzające planowanie/metadane.

Dzięki temu odtwarzana mowa pozostaje skupiona na tekście skierowanym do dzwoniącego i unika
przedostawania się tekstu planowania do audio.

### Zachowanie przy rozpoczęciu rozmowy

Dla połączeń wychodzących `conversation` obsługa pierwszej wiadomości jest powiązana z
bieżącym stanem odtwarzania:

- Czyszczenie kolejki barging-in i automatyczna odpowiedź są tłumione tylko wtedy, gdy początkowe powitanie jest aktywnie odtwarzane.
- Jeśli początkowe odtwarzanie zakończy się błędem, połączenie wraca do stanu `listening`, a początkowa wiadomość pozostaje w kolejce do ponownej próby.
- Początkowe odtwarzanie dla streamingu Twilio zaczyna się po podłączeniu strumienia bez dodatkowego opóźnienia.
- Barging-in przerywa aktywne odtwarzanie i czyści wpisy Twilio TTS zakolejkowane, ale jeszcze nieodtwarzane. Wyczyszczone wpisy są rozliczane jako pominięte, dzięki czemu logika kolejnej odpowiedzi może kontynuować bez czekania na audio, które nigdy nie zostanie odtworzone.
- Rozmowy głosowe w czasie rzeczywistym używają własnej tury otwierającej strumienia czasu rzeczywistego. Voice Call **nie** publikuje starszej aktualizacji TwiML `<Say>` dla tej początkowej wiadomości, dzięki czemu wychodzące sesje `<Connect><Stream>` pozostają podłączone.

### Okres karencji przy rozłączeniu strumienia Twilio

Gdy strumień mediów Twilio się rozłącza, Voice Call czeka **2000 ms** przed
automatycznym zakończeniem połączenia:

- Jeśli strumień połączy się ponownie w tym oknie, automatyczne zakończenie zostanie anulowane.
- Jeśli po okresie karencji żaden strumień nie zarejestruje się ponownie, połączenie zostaje zakończone, aby zapobiec zawieszonym aktywnym połączeniom.

## Czyściciel nieaktualnych połączeń

Użyj `staleCallReaperSeconds`, aby kończyć połączenia, które nigdy nie otrzymują końcowego
Webhook (na przykład połączenia w trybie notify, które nigdy się nie kończą). Wartość domyślna
to `0` (wyłączone).

Zalecane zakresy:

- **Produkcja:** `120`–`300` sekund dla przepływów w stylu notify.
- Utrzymuj tę wartość **wyższą niż `maxDurationSeconds`**, aby normalne połączenia mogły się zakończyć. Dobrym punktem wyjścia jest `maxDurationSeconds + 30–60` sekund.

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

Gdy przed Gateway znajduje się proxy lub tunel, plugin
rekonstruuje publiczny adres URL do weryfikacji podpisu. Te opcje
kontrolują, którym przekazanym nagłówkom można ufać:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Lista dozwolonych hostów z przekazanych nagłówków.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Ufaj przekazanym nagłówkom bez listy dozwolonych.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Ufaj przekazanym nagłówkom tylko wtedy, gdy zdalny adres IP żądania pasuje do listy.
</ParamField>

Dodatkowe zabezpieczenia:

- Ochrona przed **powtórzeniem Webhook** jest włączona dla Twilio i Plivo. Powtórzone prawidłowe żądania Webhook są potwierdzane, ale pomijane pod względem skutków ubocznych.
- Tury rozmów Twilio zawierają token per tura w callbackach `<Gather>`, dzięki czemu nieaktualne/powtórzone callbacki mowy nie mogą spełnić nowszej oczekującej tury transkrypcji.
- Nieuwierzytelnione żądania Webhook są odrzucane przed odczytem treści, gdy brakuje wymaganych przez dostawcę nagłówków podpisu.
- Webhook voice-call używa współdzielonego profilu treści przed uwierzytelnieniem (64 KB / 5 sekund) oraz limitu per IP dla żądań w toku przed weryfikacją podpisu.

Przykład ze stabilnym publicznym hostem:

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
openclaw voicecall latency                      # podsumowuje opóźnienie tur na podstawie logów
openclaw voicecall expose --mode funnel
```

`latency` odczytuje `calls.jsonl` z domyślnej ścieżki przechowywania voice-call.
Użyj `--file <path>`, aby wskazać inny log, oraz `--last <n>`, aby ograniczyć
analizę do ostatnich N rekordów (domyślnie 200). Wyjście zawiera p50/p90/p99
dla opóźnienia tur i czasów oczekiwania na nasłuch.

## Narzędzie agenta

Nazwa narzędzia: `voice_call`.

| Działanie        | Argumenty                 |
| ---------------- | ------------------------- |
| `initiate_call`  | `message`, `to?`, `mode?` |
| `continue_call`  | `callId`, `message`       |
| `speak_to_user`  | `callId`, `message`       |
| `send_dtmf`      | `callId`, `digits`        |
| `end_call`       | `callId`                  |
| `get_status`     | `callId`                  |

To repozytorium dostarcza pasujący dokument Skills pod adresem `skills/voice-call/SKILL.md`.

## Gateway RPC

| Metoda             | Argumenty                 |
| ------------------ | ------------------------- |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## Powiązane

- [Tryb rozmowy](/pl/nodes/talk)
- [Text-to-speech](/pl/tools/tts)
- [Voice Wake](/pl/nodes/voicewake)
