---
read_when:
    - Chcesz połączyć OpenClaw z obszarem roboczym Raft
    - Konfigurujesz zewnętrznego agenta Raft
    - Debugujesz dostarczanie wybudzania Raft
sidebarTitle: Raft
summary: Obsługa zewnętrznego agenta Raft przez mostek wybudzania CLI Raft
title: Raft
x-i18n:
    generated_at: "2026-06-27T17:13:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef9ebfd27e69575d9a1534b3b31f05036f081c54a2379411d2c7fb6f8165d558
    source_path: channels/raft.md
    workflow: 16
---

Obsługa Raft łączy agenta OpenClaw z zewnętrznym agentem Raft za pośrednictwem lokalnego
Raft CLI. Raft wysyła uwierzytelnione wskazówki wybudzania do Gateway. Następnie agent używa
Raft CLI do sprawdzania i wysyłania wiadomości.

## Instalacja

Raft jest oficjalnym zewnętrznym pluginem. Zainstaluj go na hoście Gateway:

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

Szczegóły: [Pluginy](/pl/tools/plugin)

## Wymagania wstępne

- Obszar roboczy Raft z zewnętrznym agentem.
- Raft CLI zainstalowany na tym samym hoście co OpenClaw Gateway.
- Profil Raft CLI, który jest już zalogowany i powiązany z tym zewnętrznym agentem.

Plugin nie przechowuje poświadczeń Raft. Raft CLI przechowuje to uwierzytelnienie
we własnym profilu.

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

Użyj nazwanego konta, gdy jeden Gateway łączy się z więcej niż jednym zewnętrznym agentem Raft:

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

Interaktywny przepływ konfiguracji zapisuje ten sam profil:

```bash
openclaw channels setup raft
```

## Jak to działa

Gdy Gateway się uruchamia, plugin:

1. Otwiera punkt końcowy HTTP wybudzania dostępny tylko przez local loopback na efemerycznym porcie.
2. Uruchamia `raft --profile <profile> agent bridge` z tym punktem końcowym i
   tokenem przypisanym do procesu.
3. Akceptuje tylko uwierzytelnione, pozbawione treści wskazówki wybudzania z tożsamością powtórzenia z lokalnego mostu.
4. Wymaga jednego z `eventId`, `attemptId`, `messageId`, `delivery_id`, `wake_id` lub `id`.
5. Deduplikuje ostatnie ponowione dostarczenia wybudzania według identyfikatora zdarzenia mostu, także między restartami Gateway.
6. Zwraca stabilną sesję uruchomieniową dla bieżącego mostu oraz pustą partię opróżniania aktywności dla protokołu Raft CLI.
7. Uruchamia jedną serializowaną turę agenta OpenClaw dla każdego zaakceptowanego wybudzenia.

Most odpowiada za ponowne próby dostarczania i ponowne połączenia Raft. Tura OpenClaw otrzymuje
tylko powiadomienie o wybudzeniu, a nie skopiowaną treść wiadomości Raft. Używa CLI do odczytu
oczekujących wiadomości i wysłania odpowiedzi:

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft nie jest zwykłym transportem wiadomości push. OpenClaw nie wysyła automatycznie
końcowego tekstu modelu z powrotem przez most, więc agent musi użyć
Raft CLI po przetworzeniu wybudzenia.
</Note>

## Weryfikacja

Sprawdź, czy OpenClaw może znaleźć CLI i ma skonfigurowany profil:

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

Następnie wyślij wiadomość do zewnętrznego agenta Raft. Dziennik Gateway powinien pokazać
uruchomienie mostu Raft, a potem przychodzące wybudzenie. Agent powinien użyć
skonfigurowanego profilu Raft do sprawdzenia oczekujących wiadomości.

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Raft CLI is missing">
    Zainstaluj Raft CLI na hoście Gateway i udostępnij `raft` w
    `PATH` usługi. Zweryfikuj to za pomocą `raft --help`, a następnie zrestartuj Gateway.
  </Accordion>
  <Accordion title="The bridge exits immediately">
    Sprawdź, czy skonfigurowany profil jest zalogowany i należy do zamierzonego
    zewnętrznego agenta Raft. Uruchom `raft --profile <profile> agent bridge` bezpośrednio,
    aby zobaczyć diagnostykę CLI.
  </Accordion>
  <Accordion title="A wake arrives but no Raft response is sent">
    Jest to oczekiwane, gdy agent nie wywołuje Raft CLI. Most wybudzania
    nie przenosi treści wiadomości ani automatycznych odpowiedzi końcowych. Sprawdź
    politykę narzędzi agenta i upewnij się, że może uruchamiać `raft --profile <profile> message
    check` oraz `message send`.
  </Accordion>
</AccordionGroup>

## Odnośniki

- [Raft](https://raft.build/)
- [Dokumentacja Raft](https://docs.raft.build/welcome/)
- [Integracja Hermes Raft](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
