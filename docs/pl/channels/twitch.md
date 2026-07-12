---
read_when:
    - Konfigurowanie integracji czatu Twitch z OpenClaw
sidebarTitle: Twitch
summary: 'Bot czatu Twitch: instalacja, dane uwierzytelniające, kontrola dostępu, odświeżanie tokenu'
title: Twitch
x-i18n:
    generated_at: "2026-07-12T14:56:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70890c0c6a648a06ad47c35016571a57c3e518296ef95311e75e32c81e60e2db
    source_path: channels/twitch.md
    workflow: 16
---

Obsługa czatu Twitch za pośrednictwem interfejsu czatu Twitch (IRC) przy użyciu klienta Twurple. OpenClaw loguje się jako konto bota Twitch, dołącza do jednego kanału na każde skonfigurowane konto i odpowiada na tym kanale.

## Instalacja

Twitch jest dostarczany jako oficjalny plugin; nie jest częścią podstawowej instalacji.

<Tabs>
  <Tab title="Rejestr npm">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="Lokalna kopia repozytorium">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

Polecenie `plugins install` rejestruje i włącza plugin. Wybranie Twitch podczas wykonywania `openclaw onboard` lub `openclaw channels add` instaluje go na żądanie. Użyj samej nazwy pakietu, aby korzystać z bieżącego wydania; przypnij dokładną wersję tylko w celu zapewnienia powtarzalności instalacji. Wymaga OpenClaw 2026.4.10 lub nowszego.

Szczegóły: [Pluginy](/pl/tools/plugin)

## Szybka konfiguracja

<Steps>
  <Step title="Zainstaluj plugin">
    Zobacz sekcję [Instalacja](#install) powyżej.
  </Step>
  <Step title="Utwórz konto bota Twitch">
    Utwórz osobne konto Twitch dla bota (lub użyj istniejącego konta).
  </Step>
  <Step title="Wygeneruj dane uwierzytelniające">
    Użyj [Generatora tokenów Twitch](https://twitchtokengenerator.com/):

    - Wybierz **Bot Token**
    - Sprawdź, czy wybrano zakresy `chat:read` i `chat:write`
    - Skopiuj **Client ID** i **Access Token**

  </Step>
  <Step title="Znajdź swój identyfikator użytkownika Twitch">
    Użyj strony [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/), aby przekształcić nazwę użytkownika w identyfikator użytkownika Twitch.
  </Step>
  <Step title="Skonfiguruj token">
    - Zmienna środowiskowa: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (tylko konto domyślne)
    - Lub konfiguracja: `channels.twitch.accessToken`

    Jeśli ustawiono oba, pierwszeństwo ma konfiguracja (zmienna środowiskowa jest tylko rozwiązaniem zapasowym dla konta domyślnego).

  </Step>
  <Step title="Uruchom Gateway">
    ```bash
    openclaw gateway run
    ```
  </Step>
</Steps>

<Warning>
Dodaj kontrolę dostępu (`allowFrom` lub `allowedRoles`), aby uniemożliwić nieupoważnionym użytkownikom wyzwalanie bota. Domyślna wartość `requireMention` to `true`.
</Warning>

Minimalna konfiguracja:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Konto Twitch bota (uwierzytelnia się)
      accessToken: "oauth:abc123...", // Token dostępu OAuth (lub użyj zmiennej środowiskowej OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Identyfikator klienta z Generatora tokenów
      channel: "yourchannel", // Do czatu którego kanału Twitch dołączyć (wymagane)
      allowFrom: ["123456789"], // (zalecane) Tylko Twój identyfikator użytkownika Twitch
    },
  },
}
```

## Czym jest

- Kanał Twitch zarządzany przez Gateway.
- Deterministyczne trasowanie: odpowiedzi zawsze wracają na kanał Twitch, z którego pochodzi wiadomość.
- Każdy kanał, do którego dołączono, jest mapowany na izolowany klucz sesji grupowej `agent:<agentId>:twitch:group:<channel>`.
- `username` to konto bota (które się uwierzytelnia), a `channel` określa pokój czatu, do którego należy dołączyć. Jeden wpis konta dołącza dokładnie do jednego kanału.
- Tokeny działają z prefiksem `oauth:` lub bez niego; OpenClaw normalizuje obie formy (kreator konfiguracji oczekuje formy `oauth:`).

## Odświeżanie tokenu (opcjonalne)

Tokeny z [Generatora tokenów Twitch](https://twitchtokengenerator.com/) nie mogą być odświeżane przez OpenClaw — po wygaśnięciu należy wygenerować je ponownie (są ważne przez kilka godzin; rejestracja aplikacji nie jest wymagana).

Aby włączyć automatyczne odświeżanie, utwórz własną aplikację w [Konsoli deweloperskiej Twitch](https://dev.twitch.tv/console) i dodaj:

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

Gdy ustawiono obie wartości, plugin używa dostawcy uwierzytelniania z odświeżaniem, który odnawia tokeny przed wygaśnięciem i rejestruje każde odświeżenie w dzienniku. Bez `refreshToken` rejestruje `token refresh disabled (no refresh token)`; bez `clientSecret` przełącza się na statyczny token (bez odświeżania).

## Obsługa wielu kont

Użyj `channels.twitch.accounts` z osobnymi danymi uwierzytelniającymi dla każdego konta. Wspólny wzorzec opisano w sekcji [Konfiguracja](/pl/gateway/configuration).

Przykład (jedno konto bota na dwóch kanałach):

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "yourchannel",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

<Note>
Każdy wpis konta wymaga własnego `accessToken` (zmienna środowiskowa obejmuje tylko konto domyślne). Konto dołącza dokładnie do jednego kanału, dlatego dołączenie do dwóch kanałów wymaga dwóch kont. `channels.twitch.defaultAccount` określa konto domyślne.
</Note>

## Kontrola dostępu

`allowFrom` jest bezwzględną listą dozwolonych identyfikatorów użytkowników Twitch. Gdy jest ustawiona, `allowedRoles` jest ignorowane; pozostaw `allowFrom` bez ustawienia, aby zamiast tego używać dostępu opartego na rolach.

**Dostępne role:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Tabs>
  <Tab title="Lista dozwolonych identyfikatorów użytkowników (najbezpieczniejsza)">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowFrom: ["123456789", "987654321"],
            },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Na podstawie ról">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowedRoles: ["moderator", "vip"],
            },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Wyłączenie wymogu @wzmianki">
    Domyślna wartość `requireMention` to `true`. Aby odpowiadać na wszystkie dozwolone wiadomości:

    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              requireMention: false,
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

<Note>
**Dlaczego identyfikatory użytkowników?** Nazwy użytkowników mogą się zmieniać, co umożliwia podszywanie się. Identyfikatory użytkowników są trwałe.

Znajdź swój za pomocą [konwertera nazwy użytkownika na identyfikator](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/).
</Note>

## Rozwiązywanie problemów

Najpierw uruchom polecenia diagnostyczne:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Bot nie odpowiada na wiadomości">
    - **Sprawdź kontrolę dostępu:** Upewnij się, że Twój identyfikator użytkownika znajduje się w `allowFrom`, albo tymczasowo usuń `allowFrom` i ustaw `allowedRoles: ["all"]` na potrzeby testu.
    - **Sprawdź wymóg wzmianki:** Przy `requireMention: true` (wartość domyślna) wiadomości muszą zawierać @wzmiankę o nazwie użytkownika bota.
    - **Sprawdź, czy bot jest na kanale:** Bot dołącza tylko do kanału określonego w `channel`.

  </Accordion>
  <Accordion title="Problemy z tokenem">
    `Failed to connect` lub błędy uwierzytelniania:

    - Sprawdź, czy `accessToken` jest wartością tokenu dostępu OAuth (prefiks `oauth:` jest opcjonalny)
    - Sprawdź, czy token ma zakresy `chat:read` i `chat:write`
    - Jeśli używasz odświeżania tokenu, sprawdź, czy ustawiono `clientSecret` i `refreshToken`

  </Accordion>
  <Accordion title="Odświeżanie tokenu nie działa">
    Sprawdź w dziennikach zdarzenia odświeżania:

    ```text
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    Jeśli widzisz `token refresh disabled (no refresh token)`:

    - Upewnij się, że podano `clientSecret`
    - Upewnij się, że podano `refreshToken`

  </Accordion>
</AccordionGroup>

## Konfiguracja

### Konfiguracja konta

<ParamField path="username" type="string" required>
  Nazwa użytkownika bota (konto używane do uwierzytelniania).
</ParamField>
<ParamField path="accessToken" type="string" required>
  Token dostępu OAuth z zakresami `chat:read` i `chat:write` (konfiguracja lub zmienna środowiskowa dla konta domyślnego).
</ParamField>
<ParamField path="clientId" type="string" required>
  Identyfikator klienta Twitch (z Generatora tokenów lub Twojej aplikacji). Opcjonalny w schemacie, ale wymagany do nawiązania połączenia.
</ParamField>
<ParamField path="channel" type="string" required>
  Kanał, do którego należy dołączyć.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Włącz to konto.
</ParamField>
<ParamField path="clientSecret" type="string">
  Opcjonalne: do automatycznego odświeżania tokenu.
</ParamField>
<ParamField path="refreshToken" type="string">
  Opcjonalne: do automatycznego odświeżania tokenu.
</ParamField>
<ParamField path="expiresIn" type="number">
  Czas wygaśnięcia tokenu w sekundach (śledzenie odświeżania).
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Znacznik czasu uzyskania tokenu (śledzenie odświeżania).
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Lista dozwolonych identyfikatorów użytkowników. Po jej ustawieniu role są ignorowane.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Kontrola dostępu oparta na rolach.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  Wymagaj @wzmianki, aby wyzwolić bota.
</ParamField>
<ParamField path="responsePrefix" type="string">
  Zastąpienie prefiksu odpowiedzi wychodzących dla tego konta.
</ParamField>

### Opcje dostawcy

- `channels.twitch.enabled` — Włączenie/wyłączenie uruchamiania kanału
- `channels.twitch.username` / `accessToken` / `clientId` / `channel` — Uproszczona konfiguracja pojedynczego konta (niejawne konto `default`; ma pierwszeństwo przed `accounts.default`)
- `channels.twitch.accounts.<accountName>` — Konfiguracja wielu kont (wszystkie pola konta wymienione powyżej)
- `channels.twitch.defaultAccount` — Nazwa konta domyślnego
- `channels.twitch.markdown.tables` — Tryb renderowania tabel Markdown (`off` | `bullets` | `code` | `block`)

Pełny przykład:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "yourchannel",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      accounts: {
        second: {
          username: "mybot",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "your_channel",
          enabled: true,
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Akcje narzędzia

Agent może wysyłać wiadomości Twitch za pośrednictwem narzędzia wiadomości przy użyciu akcji `send`:

```json5
{
  channel: "twitch",
  action: "send",
  to: "#mychannel",
  message: "Hello Twitch!",
}
```

`to` jest opcjonalne i domyślnie przyjmuje wartość `channel` skonfigurowaną dla konta.

## Bezpieczeństwo i eksploatacja

- **Traktuj tokeny jak hasła** — nigdy nie zatwierdzaj tokenów w git.
- **Używaj automatycznego odświeżania tokenów** w przypadku długo działających botów.
- **Używaj list dozwolonych identyfikatorów użytkowników** zamiast nazw użytkowników do kontroli dostępu.
- **Monitoruj dzienniki** pod kątem zdarzeń odświeżania tokenów i stanu połączenia.
- **Minimalizuj zakresy tokenów** — żądaj tylko `chat:read` i `chat:write`.
- **W razie problemów**: uruchom ponownie Gateway po potwierdzeniu, że żaden inny proces nie jest właścicielem sesji.

## Ograniczenia

- **500 znaków** na wiadomość; dłuższe odpowiedzi są dzielone na granicach słów.
- Markdown jest usuwany przed wysłaniem (czat Twitch używa zwykłego tekstu; znaki nowego wiersza są zastępowane spacjami).
- OpenClaw nie dodaje własnego ograniczania częstotliwości; klient czatu Twurple obsługuje limity częstotliwości Twitch.

## Powiązane

- [Trasowanie kanałów](/pl/channels/channel-routing) — trasowanie sesji dla wiadomości
- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i wymóg wzmianki
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie w wiadomościach prywatnych i proces parowania
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
