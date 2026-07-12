---
read_when:
    - Chcesz połączyć OpenClaw z przestrzenią roboczą Raft
    - Konfigurujesz zewnętrznego agenta Raft
    - Debugujesz dostarczanie wybudzeń Raft
sidebarTitle: Raft
summary: Obsługa Raft External Agent za pośrednictwem mostka wybudzania CLI Raft
title: Tratwa
x-i18n:
    generated_at: "2026-07-12T14:54:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 454d92d764a4ec3b0ec52467cba254dcad795870e04d1d32d4cf65d8b451a0de
    source_path: channels/raft.md
    workflow: 16
---

Raft łączy agenta OpenClaw z agentem zewnętrznym Raft za pośrednictwem lokalnego
CLI Raft. Raft wysyła uwierzytelnione sygnały wybudzenia do Gateway; następnie agent
używa CLI Raft do sprawdzania i wysyłania wiadomości. Obsługiwany jest wyłącznie czat bezpośredni (bez grup).

## Instalacja

Raft jest oficjalnym zewnętrznym pluginem. Zainstaluj go na hoście Gateway:

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

Szczegóły: [Pluginy](/pl/tools/plugin)

## Wymagania wstępne

- Obszar roboczy Raft z agentem zewnętrznym.
- CLI Raft zainstalowane na tym samym hoście co Gateway OpenClaw i dostępne
  w zmiennej `PATH` usługi.
- Profil CLI Raft, w którym użytkownik jest już zalogowany i który jest powiązany
  z tym agentem zewnętrznym.

Plugin nie przechowuje danych uwierzytelniających Raft; CLI Raft przechowuje
uwierzytelnienie we własnym profilu.

## Konfiguracja

Ustaw profil w konfiguracji:

```json5
{
  channels: {
    raft: {
      enabled: true,
      profile: "openclaw",
    },
  },
}
```

Dla konta domyślnego możesz zamiast tego ustawić `RAFT_PROFILE` w środowisku
Gateway:

```bash
RAFT_PROFILE=openclaw
```

Użyj nazwanego konta, gdy jeden Gateway łączy się z więcej niż jednym agentem zewnętrznym Raft:

```json5
{
  channels: {
    raft: {
      accounts: {
        support: {
          profile: "support-agent",
        },
        engineering: {
          profile: "engineering-agent",
        },
      },
    },
  },
}
```

Konfiguracja interaktywna zapisuje ten sam profil:

```bash
openclaw channels add --channel raft
```

## Jak to działa

Po uruchomieniu Gateway plugin:

1. Otwiera punkt końcowy HTTP wybudzania dostępny wyłącznie przez local loopback, używając portu efemerycznego.
2. Uruchamia `raft --profile <profile> agent bridge` z tym punktem końcowym oraz
   tokenem unikatowym dla procesu.
3. Akceptuje wyłącznie uwierzytelnione, niezawierające treści sygnały wybudzenia z identyfikatorem
   zapobiegającym ponownemu odtworzeniu, pochodzące z lokalnego mostu.
4. Wymaga jednego z pól `eventId`, `attemptId`, `messageId`, `delivery_id`,
   `wake_id` lub `id` w każdym ładunku wybudzenia.
5. Deduplikuje ponawiane dostarczenia wybudzeń według identyfikatora zdarzenia mostu przez 24 godziny,
   również po ponownym uruchomieniu Gateway.
6. Zwraca stabilną sesję środowiska uruchomieniowego dla bieżącego mostu oraz pustą
   partię opróżniania aktywności dla protokołu CLI Raft.
7. Uruchamia jedną serializowaną turę agenta OpenClaw dla każdego zaakceptowanego wybudzenia.

Most odpowiada za ponawianie dostarczania przez Raft i ponowne nawiązywanie połączenia. Tura OpenClaw
otrzymuje wyłącznie powiadomienie o wybudzeniu, a nie skopiowaną treść wiadomości Raft. Używa CLI
do odczytywania oczekujących wiadomości i wysyłania odpowiedzi:

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft nie jest transportem wiadomości typu push. OpenClaw nie wysyła automatycznie końcowego tekstu modelu z powrotem przez most, dlatego po przetworzeniu wybudzenia agent musi użyć CLI Raft.
</Note>

## Weryfikacja

Sprawdź, czy OpenClaw może znaleźć CLI i ma skonfigurowany profil:

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

Następnie wyślij wiadomość do agenta zewnętrznego Raft. Dziennik Gateway powinien pokazać
uruchomienie mostu Raft, a następnie przychodzące wybudzenie. Agent powinien użyć
skonfigurowanego profilu Raft do sprawdzenia oczekujących wiadomości.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Brakuje CLI Raft">
    Zainstaluj CLI Raft na hoście Gateway i udostępnij polecenie `raft` w zmiennej
    `PATH` usługi. Zweryfikuj je za pomocą `raft --help`, a następnie uruchom ponownie Gateway.
  </Accordion>
  <Accordion title="Most natychmiast kończy działanie">
    Sprawdź, czy skonfigurowany profil jest zalogowany i należy do właściwego
    agenta zewnętrznego Raft. Uruchom bezpośrednio `raft --profile <profile> agent bridge`,
    aby zobaczyć diagnostykę CLI.
  </Accordion>
  <Accordion title="Wybudzenie dociera, ale odpowiedź Raft nie jest wysyłana">
    Jest to oczekiwane, gdy agent nie wywołuje CLI Raft. Most wybudzania
    nie przenosi treści wiadomości ani automatycznych odpowiedzi końcowych. Sprawdź
    zasady używania narzędzi przez agenta i upewnij się, że może on uruchamiać `raft --profile <profile>
    message check` oraz `message send`.
  </Accordion>
</AccordionGroup>

## Materiały referencyjne

- [Raft](https://raft.build/)
- [Dokumentacja Raft](https://docs.raft.build/welcome/)
- [Integracja Hermes z Raft](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
