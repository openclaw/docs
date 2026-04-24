---
read_when:
    - Konfigurowanie cichego streamingu Matrix dla self-hosted Synapse lub Tuwunel
    - Użytkownicy chcą otrzymywać powiadomienia tylko przy zakończonych blokach, a nie przy każdej edycji podglądu.
summary: Reguły push Matrix per odbiorca dla cichych, sfinalizowanych edycji podglądu
title: Reguły push Matrix dla cichych podglądów
x-i18n:
    generated_at: "2026-04-24T08:58:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07a8cf9a4041b63e13feb21ee2eb22909cb14931d6929bedf6b94315f7a270cf
    source_path: channels/matrix-push-rules.md
    workflow: 15
---

Gdy `channels.matrix.streaming` ma wartość `"quiet"`, OpenClaw edytuje pojedyncze zdarzenie podglądu w miejscu i oznacza sfinalizowaną edycję niestandardową flagą treści. Klienci Matrix wysyłają powiadomienie o końcowej edycji tylko wtedy, gdy reguła push per użytkownik dopasuje tę flagę. Ta strona jest przeznaczona dla operatorów, którzy hostują Matrix samodzielnie i chcą zainstalować tę regułę dla każdego konta odbiorcy.

Jeśli chcesz tylko standardowego zachowania powiadomień Matrix, użyj `streaming: "partial"` albo pozostaw streaming wyłączony. Zobacz [konfigurację kanału Matrix](/pl/channels/matrix#streaming-previews).

## Wymagania wstępne

- użytkownik odbiorcy = osoba, która ma otrzymać powiadomienie
- użytkownik bota = konto Matrix OpenClaw, które wysyła odpowiedź
- do poniższych wywołań API użyj tokenu dostępu użytkownika odbiorcy
- dopasuj `sender` w regule push do pełnego MXID użytkownika bota
- konto odbiorcy musi mieć już działające pushery — reguły cichego podglądu działają tylko wtedy, gdy zwykłe dostarczanie push Matrix działa poprawnie

## Kroki

<Steps>
  <Step title="Skonfiguruj ciche podglądy">

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

  </Step>

  <Step title="Pobierz token dostępu odbiorcy">
    Jeśli to możliwe, użyj ponownie tokenu istniejącej sesji klienta. Aby utworzyć nowy:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": { "type": "m.id.user", "user": "@alice:example.org" },
    "password": "REDACTED"
  }'
```

  </Step>

  <Step title="Sprawdź, czy istnieją pushery">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Jeśli nie zostaną zwrócone żadne pushery, najpierw napraw zwykłe dostarczanie push Matrix dla tego konta, zanim przejdziesz dalej.

  </Step>

  <Step title="Zainstaluj regułę push override">
    OpenClaw oznacza sfinalizowane edycje podglądu tylko tekstowego za pomocą `content["com.openclaw.finalized_preview"] = true`. Zainstaluj regułę dopasowującą ten znacznik oraz MXID bota jako nadawcę:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

    Zastąp przed uruchomieniem:

    - `https://matrix.example.org`: bazowy URL twojego homeserwera
    - `$USER_ACCESS_TOKEN`: token dostępu użytkownika odbiorcy
    - `openclaw-finalized-preview-botname`: identyfikator reguły unikalny dla każdego bota i odbiorcy (wzorzec: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: MXID twojego bota OpenClaw, nie odbiorcy

  </Step>

  <Step title="Zweryfikuj">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Następnie przetestuj streamowaną odpowiedź. W trybie quiet pokój pokazuje cichy podgląd wersji roboczej i wysyła jedno powiadomienie po zakończeniu bloku lub tury.

  </Step>
</Steps>

Aby później usunąć regułę, wyślij `DELETE` na ten sam URL reguły z użyciem tokenu odbiorcy.

## Uwagi dotyczące wielu botów

Reguły push są kluczowane przez `ruleId`: ponowne wywołanie `PUT` dla tego samego identyfikatora aktualizuje jedną regułę. Jeśli wiele botów OpenClaw ma wysyłać powiadomienia do tego samego odbiorcy, utwórz osobną regułę dla każdego bota z odrębnym dopasowaniem nadawcy.

Nowe reguły `override` zdefiniowane przez użytkownika są wstawiane przed domyślnymi regułami wyciszania, więc nie jest potrzebny żaden dodatkowy parametr kolejności. Reguła wpływa tylko na edycje podglądu tylko tekstowego, które można sfinalizować w miejscu; fallbacki dla mediów i fallbacki dla nieaktualnego podglądu używają zwykłego dostarczania Matrix.

## Uwagi dotyczące homeserwera

<AccordionGroup>
  <Accordion title="Synapse">
    Nie jest wymagana żadna specjalna zmiana w `homeserver.yaml`. Jeśli zwykłe powiadomienia Matrix już docierają do tego użytkownika, token odbiorcy + wywołanie `pushrules` powyżej to główny krok konfiguracji.

    Jeśli uruchamiasz Synapse za reverse proxy lub workerami, upewnij się, że `/_matrix/client/.../pushrules/` trafia poprawnie do Synapse. Dostarczanie push jest obsługiwane przez główny proces albo `synapse.app.pusher` / skonfigurowane workery pushera — upewnij się, że działają poprawnie.

  </Accordion>

  <Accordion title="Tuwunel">
    Ten sam przepływ co w Synapse; dla znacznika sfinalizowanego podglądu nie jest potrzebna żadna konfiguracja specyficzna dla Tuwunel.

    Jeśli powiadomienia znikają, gdy użytkownik jest aktywny na innym urządzeniu, sprawdź, czy włączone jest `suppress_push_when_active`. Tuwunel dodał tę opcję w wersji 1.4.2 (wrzesień 2025) i może ona celowo wyciszać powiadomienia push na innych urządzeniach, gdy jedno urządzenie jest aktywne.

  </Accordion>
</AccordionGroup>

## Powiązane

- [Konfiguracja kanału Matrix](/pl/channels/matrix)
- [Koncepcje streamingu](/pl/concepts/streaming)
