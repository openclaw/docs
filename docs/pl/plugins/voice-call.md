---
read_when:
    - Chcesz wykonać wychodzące połączenie głosowe z OpenClaw
    - Konfigurujesz lub rozwijasz Plugin połączeń głosowych
    - Potrzebujesz głosu w czasie rzeczywistym lub strumieniowej transkrypcji w telefonii
sidebarTitle: Voice call
summary: Wykonuj wychodzące i odbieraj przychodzące połączenia głosowe przez Twilio, Telnyx lub Plivo, z opcjonalną obsługą głosu w czasie rzeczywistym i strumieniową transkrypcją
title: Plugin połączeń głosowych
x-i18n:
    generated_at: "2026-04-30T10:11:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7976b84ce1ee6e29706e595a4a25337632b34a9bb8f7cecdee1d6f833a8ce932
    source_path: plugins/voice-call.md
    workflow: 16
---

Połączenia głosowe dla OpenClaw przez Plugin. Obsługuje powiadomienia wychodzące,
konwersacje wieloturowe, dwukierunkowy głos w czasie rzeczywistym, strumieniową
transkrypcję oraz połączenia przychodzące z zasadami listy dozwolonych.

**Obecni dostawcy:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (środowisko deweloperskie/bez sieci).

<Note>
Plugin Voice Call działa **wewnątrz procesu Gateway**. Jeśli używasz
zdalnego Gateway, zainstaluj i skonfiguruj Plugin na maszynie uruchamiającej
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
      <Tab title="Z folderu lokalnego (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Jeśli npm zgłasza pakiet należący do OpenClaw jako przestarzały, ta wersja pakietu
    pochodzi ze starszej zewnętrznej serii pakietów; użyj bieżącego spakowanego buildu OpenClaw
    albo ścieżki folderu lokalnego, dopóki nie zostanie opublikowany nowszy pakiet npm.

    Następnie uruchom ponownie Gateway, aby Plugin został załadowany.

  </Step>
  <Step title="Skonfiguruj dostawcę i webhook">
    Ustaw konfigurację w `plugins.entries.voice-call.config` (pełny kształt znajdziesz
    poniżej w sekcji [Konfiguracja](#configuration)). Wymagane minimum to:
    `provider`, dane uwierzytelniające dostawcy, `fromNumber` oraz publicznie
    osiągalny adres URL webhooka.
  </Step>
  <Step title="Zweryfikuj konfigurację">
    ```bash
    openclaw voicecall setup
    ```

    Domyślne wyjście jest czytelne w logach czatu i terminalach. Sprawdza
    włączenie Plugin, dane uwierzytelniające dostawcy, ekspozycję webhooka oraz to,
    czy aktywny jest tylko jeden tryb audio (`streaming` albo `realtime`). Użyj
    `--json` dla skryptów.

  </Step>
  <Step title="Test smoke">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Oba polecenia domyślnie działają jako przebiegi próbne. Dodaj `--yes`, aby faktycznie wykonać krótkie
    wychodzące połączenie powiadamiające:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
W przypadku Twilio, Telnyx i Plivo konfiguracja musi wskazywać **publiczny adres URL webhooka**.
Jeśli `publicUrl`, adres URL tunelu, adres URL Tailscale albo zapasowy adres udostępniania
rozwiązuje się na local loopback lub prywatną przestrzeń sieciową, konfiguracja kończy się niepowodzeniem zamiast
uruchamiać dostawcę, który nie może odbierać webhooków operatora.
</Warning>

## Konfiguracja

Jeśli `enabled: true`, ale wybranemu dostawcy brakuje danych uwierzytelniających,
uruchomienie Gateway zapisuje ostrzeżenie o niekompletnej konfiguracji z brakującymi kluczami i
pomija uruchomienie środowiska wykonawczego. Polecenia, wywołania RPC i narzędzia agenta nadal
zwracają dokładną brakującą konfigurację dostawcy podczas użycia.

<Note>
Dane uwierzytelniające voice-call akceptują SecretRefs. `plugins.entries.voice-call.config.twilio.authToken` oraz `plugins.entries.voice-call.config.tts.providers.*.apiKey` są rozwiązywane przez standardową powierzchnię SecretRef; zobacz [powierzchnię danych uwierzytelniających SecretRef](/pl/reference/secretref-credential-surface).
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
  <Accordion title="Uwagi dotyczące ekspozycji dostawcy i zabezpieczeń">
    - Twilio, Telnyx i Plivo wymagają **publicznie osiągalnego** adresu URL webhooka.
    - `mock` to lokalny dostawca deweloperski (bez wywołań sieciowych).
    - Telnyx wymaga `telnyx.publicKey` (albo `TELNYX_PUBLIC_KEY`), chyba że `skipSignatureVerification` ma wartość true.
    - `skipSignatureVerification` służy wyłącznie do testów lokalnych.
    - W darmowej warstwie ngrok ustaw `publicUrl` na dokładny adres URL ngrok; weryfikacja podpisu jest zawsze egzekwowana.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` zezwala na webhooki Twilio z nieprawidłowymi podpisami **tylko** wtedy, gdy `tunnel.provider="ngrok"` i `serve.bind` jest local loopback (lokalny agent ngrok). Tylko lokalne środowisko deweloperskie.
    - Adresy URL darmowej warstwy ngrok mogą się zmieniać lub dodawać stronę pośrednią; jeśli `publicUrl` się rozjedzie, podpisy Twilio zawiodą. Produkcja: preferuj stabilną domenę albo lejek Tailscale.

  </Accordion>
  <Accordion title="Limity połączeń strumieniowych">
    - `streaming.preStartTimeoutMs` zamyka gniazda, które nigdy nie wysyłają prawidłowej ramki `start`.
    - `streaming.maxPendingConnections` ogranicza łączną liczbę nieuwierzytelnionych gniazd przed startem.
    - `streaming.maxPendingConnectionsPerIp` ogranicza nieuwierzytelnione gniazda przed startem na źródłowy adres IP.
    - `streaming.maxConnections` ogranicza łączną liczbę otwartych gniazd strumienia multimediów (oczekujące + aktywne).

  </Accordion>
  <Accordion title="Migracje starszej konfiguracji">
    Starsze konfiguracje używające `provider: "log"`, `twilio.from` albo starszych
    kluczy OpenAI w `streaming.*` są przepisywane przez `openclaw doctor --fix`.
    Zapasowa ścieżka środowiska wykonawczego nadal na razie akceptuje stare klucze voice-call, ale
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

## Konwersacje głosowe w czasie rzeczywistym

`realtime` wybiera dostawcę dwukierunkowego głosu w czasie rzeczywistym dla audio połączeń
na żywo. Jest oddzielne od `streaming`, które tylko przekazuje audio do
dostawców transkrypcji w czasie rzeczywistym.

<Warning>
`realtime.enabled` nie można łączyć z `streaming.enabled`. Wybierz jeden
tryb audio na połączenie.
</Warning>

Bieżące zachowanie środowiska wykonawczego:

- `realtime.enabled` jest obsługiwane dla Twilio Media Streams.
- `realtime.provider` jest opcjonalne. Jeśli nie jest ustawione, Voice Call używa pierwszego zarejestrowanego dostawcy głosu w czasie rzeczywistym.
- Dołączani dostawcy głosu w czasie rzeczywistym: Google Gemini Live (`google`) oraz OpenAI (`openai`), rejestrowani przez swoje pluginy dostawców.
- Surowa konfiguracja należąca do dostawcy znajduje się pod `realtime.providers.<providerId>`.
- Voice Call domyślnie udostępnia współdzielone narzędzie czasu rzeczywistego `openclaw_agent_consult`. Model czasu rzeczywistego może je wywołać, gdy dzwoniący prosi o głębsze rozumowanie, aktualne informacje albo zwykłe narzędzia OpenClaw.
- Jeśli `realtime.provider` wskazuje niezarejestrowanego dostawcę albo w ogóle nie zarejestrowano żadnego dostawcy głosu w czasie rzeczywistym, Voice Call zapisuje ostrzeżenie i pomija multimedia czasu rzeczywistego zamiast powodować niepowodzenie całego Plugin.
- Klucze sesji konsultacji ponownie używają istniejącej sesji głosowej, gdy jest dostępna, a następnie przechodzą zapasowo na numer telefonu dzwoniącego/odbiorcy, aby kolejne wywołania konsultacji zachowywały kontekst w trakcie połączenia.

### Zasady narzędzi

`realtime.toolPolicy` steruje przebiegiem konsultacji:

| Zasada           | Zachowanie                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Udostępnia narzędzie konsultacji i ogranicza zwykłego agenta do `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` oraz `memory_get`. |
| `owner`          | Udostępnia narzędzie konsultacji i pozwala zwykłemu agentowi używać normalnych zasad narzędzi agenta.                                                      |
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

Zobacz [dostawcę Google](/pl/providers/google) oraz
[dostawcę OpenAI](/pl/providers/openai), aby poznać opcje głosu w czasie rzeczywistym
specyficzne dla dostawcy.

## Transkrypcja strumieniowa

`streaming` wybiera dostawcę transkrypcji w czasie rzeczywistym dla audio połączenia na żywo.

Bieżące zachowanie środowiska wykonawczego:

- `streaming.provider` jest opcjonalne. Jeśli nie jest ustawione, Voice Call używa pierwszego zarejestrowanego dostawcy transkrypcji w czasie rzeczywistym.
- Dołączani dostawcy transkrypcji w czasie rzeczywistym: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) oraz xAI (`xai`), rejestrowani przez swoje pluginy dostawców.
- Surowa konfiguracja należąca do dostawcy znajduje się pod `streaming.providers.<providerId>`.
- Jeśli `streaming.provider` wskazuje niezarejestrowanego dostawcę albo żaden nie jest zarejestrowany, Voice Call zapisuje ostrzeżenie i pomija strumieniowanie multimediów zamiast powodować niepowodzenie całego Plugin.

### Przykłady dostawców strumieniowania

<Tabs>
  <Tab title="OpenAI">
    Wartości domyślne: klucz API `streaming.providers.openai.apiKey` albo
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
    Wartości domyślne: klucz API `streaming.providers.xai.apiKey` albo `XAI_API_KEY`;
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
mowy w połączeniach. Możesz ją nadpisać w konfiguracji Plugin przy użyciu
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
obecny transport Microsoft nie udostępnia wyjścia telefonicznego PCM.
</Warning>

Uwagi dotyczące zachowania:

- Starsze klucze `tts.<provider>` w konfiguracji Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) są naprawiane przez `openclaw doctor --fix`; zatwierdzona konfiguracja powinna używać `tts.providers.<provider>`.
- Podstawowy TTS jest używany, gdy włączone jest strumieniowanie multimediów Twilio; w przeciwnym razie połączenia wracają do natywnych głosów dostawcy.
- Jeśli strumień multimediów Twilio jest już aktywny, Voice Call nie wraca do TwiML `<Say>`. Jeśli telefoniczny TTS jest w tym stanie niedostępny, żądanie odtwarzania kończy się niepowodzeniem zamiast mieszać dwie ścieżki odtwarzania.
- Gdy telefoniczny TTS wraca do dostawcy zapasowego, Voice Call zapisuje ostrzeżenie z łańcuchem dostawców (`from`, `to`, `attempts`) do debugowania.
- Gdy wtrącenie Twilio albo zamknięcie strumienia czyści oczekującą kolejkę TTS, zakolejkowane żądania odtwarzania są rozstrzygane zamiast pozostawiać dzwoniących w oczekiwaniu na zakończenie odtwarzania.

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
`allowFrom`. Weryfikacja Webhook uwierzytelnia dostarczenie przez dostawcę oraz
integralność ładunku, ale **nie** dowodzi własności numeru dzwoniącego
PSTN/VoIP. Traktuj `allowFrom` jako filtrowanie identyfikacji dzwoniącego, a nie silną
tożsamość dzwoniącego.
</Warning>

Automatyczne odpowiedzi używają systemu agenta. Dostosuj za pomocą `responseModel`,
`responseSystemPrompt` i `responseTimeoutMs`.

### Kontrakt wypowiedzi głosowej

Dla automatycznych odpowiedzi Voice Call dołącza ścisły kontrakt wypowiedzi głosowej do
promptu systemowego:

```text
{"spoken":"..."}
```

Voice Call defensywnie wyodrębnia tekst mowy:

- Ignoruje ładunki oznaczone jako treści rozumowania/błędu.
- Parsuje bezpośredni JSON, JSON w bloku kodu albo wbudowane klucze `"spoken"`.
- Wraca do zwykłego tekstu i usuwa prawdopodobne akapity wprowadzające z planowaniem/metadanymi.

Dzięki temu odtwarzana mowa pozostaje skupiona na tekście dla dzwoniącego i unika
wycieku tekstu planowania do dźwięku.

### Zachowanie uruchamiania rozmowy

W przypadku wychodzących połączeń `conversation` obsługa pierwszej wiadomości jest powiązana ze stanem
odtwarzania na żywo:

- Czyszczenie kolejki po wtrąceniu i automatyczna odpowiedź są wstrzymywane tylko wtedy, gdy początkowe powitanie jest aktywnie wypowiadane.
- Jeśli początkowe odtwarzanie się nie powiedzie, połączenie wraca do stanu `listening`, a początkowa wiadomość pozostaje w kolejce do ponowienia.
- Początkowe odtwarzanie dla strumieniowania Twilio zaczyna się przy połączeniu strumienia bez dodatkowego opóźnienia.
- Wtrącenie przerywa aktywne odtwarzanie i czyści zakolejkowane, ale jeszcze nieodtwarzane wpisy Twilio TTS. Wyczyszczone wpisy są rozstrzygane jako pominięte, więc logika kolejnej odpowiedzi może kontynuować bez czekania na dźwięk, który nigdy nie zostanie odtworzony.
- Rozmowy głosowe w czasie rzeczywistym używają własnej początkowej tury strumienia czasu rzeczywistego. Voice Call **nie** publikuje starszej aktualizacji TwiML `<Say>` dla tej początkowej wiadomości, więc wychodzące sesje `<Connect><Stream>` pozostają podłączone.

### Okres karencji po rozłączeniu strumienia Twilio

Gdy strumień multimediów Twilio się rozłącza, Voice Call czeka **2000 ms** przed
automatycznym zakończeniem połączenia:

- Jeśli strumień połączy się ponownie w tym oknie, automatyczne zakończenie zostaje anulowane.
- Jeśli po okresie karencji żaden strumień nie zarejestruje się ponownie, połączenie zostaje zakończone, aby zapobiec zablokowanym aktywnym połączeniom.

## Czyszczenie nieaktualnych połączeń

Użyj `staleCallReaperSeconds`, aby kończyć połączenia, które nigdy nie otrzymują końcowego
Webhook (na przykład połączenia w trybie powiadamiania, które nigdy się nie kończą). Wartość domyślna
to `0` (wyłączone).

Zalecane zakresy:

- **Produkcja:** `120`–`300` sekund dla przepływów typu powiadomienie.
- Utrzymuj tę wartość **wyższą niż `maxDurationSeconds`**, aby zwykłe połączenia mogły się zakończyć. Dobry punkt wyjścia to `maxDurationSeconds + 30–60` sekund.

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

Gdy proxy lub tunel znajduje się przed Gateway, Plugin
rekonstruuje publiczny URL do weryfikacji podpisu. Te opcje
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

- Ochrona przed **powtórzeniem Webhook** jest włączona dla Twilio i Plivo. Powtórzone poprawne żądania Webhook są potwierdzane, ale pomijane pod kątem skutków ubocznych.
- Tury rozmowy Twilio zawierają token dla każdej tury w callbackach `<Gather>`, więc nieaktualne/powtórzone callbacki mowy nie mogą zaspokoić nowszej oczekującej tury transkrypcji.
- Nieuwierzytelnione żądania Webhook są odrzucane przed odczytem treści, gdy brakuje wymaganych przez dostawcę nagłówków podpisu.
- Webhook voice-call używa współdzielonego profilu treści przed uwierzytelnieniem (64 KB / 5 sekund) oraz limitu trwających żądań na adres IP przed weryfikacją podpisu.

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
openclaw voicecall latency                      # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

`latency` odczytuje `calls.jsonl` z domyślnej ścieżki przechowywania voice-call.
Użyj `--file <path>`, aby wskazać inny dziennik, oraz `--last <n>`, aby ograniczyć
analizę do ostatnich N rekordów (domyślnie 200). Dane wyjściowe zawierają p50/p90/p99
dla opóźnienia tury i czasów oczekiwania na nasłuchiwanie.

## Narzędzie agenta

Nazwa narzędzia: `voice_call`.

| Akcja           | Argumenty                 |
| --------------- | ------------------------- |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `send_dtmf`     | `callId`, `digits`        |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

To repozytorium dostarcza pasującą dokumentację skill pod adresem `skills/voice-call/SKILL.md`.

## RPC Gateway

| Metoda               | Argumenty                 |
| -------------------- | ------------------------- |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## Powiązane

- [Tryb rozmowy](/pl/nodes/talk)
- [Tekst na mowę](/pl/tools/tts)
- [Wybudzanie głosem](/pl/nodes/voicewake)
