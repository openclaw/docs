---
read_when:
    - Konfigurowanie cichego strumieniowania w Matrix dla samodzielnie hostowanego Synapse lub Tuwunel
    - Użytkownicy chcą otrzymywać powiadomienia tylko po zakończeniu bloków, a nie po każdej zmianie podglądu
summary: Reguły powiadomień push Matrix dla poszczególnych odbiorców dotyczące cichych edycji sfinalizowanego podglądu
title: Reguły push dla Matrix dotyczące cichych podglądów
x-i18n:
    generated_at: "2026-07-12T14:53:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f2260b4cc68f82cbe1aef86b8963b6b40e93f089b31991964fc9282b2c121fb
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

Gdy `channels.matrix.streaming` ma wartość `"quiet"`, OpenClaw przesyła odpowiedź strumieniowo, edytując w miejscu pojedyncze zdarzenie podglądu. Podglądy są wysyłane jako niegenerujące powiadomień zdarzenia `m.notice`, a końcowa edycja jest oznaczana za pomocą `content["com.openclaw.finalized_preview"] = true`. Klienci Matrix powiadamiają o tej końcowej edycji tylko wtedy, gdy znacznik pasuje do reguły powiadomień danego użytkownika. Ta strona jest przeznaczona dla operatorów samodzielnie hostujących Matrix, którzy chcą zainstalować tę regułę dla każdego konta odbiorcy.

`streaming: "progress"` finalizuje wersje robocze tą samą ścieżką, dlatego ta sama reguła jest również wyzwalana dla sfinalizowanych edycji w trybie postępu.

Jeśli chcesz korzystać wyłącznie ze standardowego mechanizmu powiadomień Matrix, użyj `streaming: "partial"` albo wyłącz przesyłanie strumieniowe. Zobacz [Konfiguracja kanału Matrix](/pl/channels/matrix#streaming-previews).

## Wymagania wstępne

- użytkownik będący odbiorcą = osoba, która powinna otrzymać powiadomienie
- użytkownik będący botem = konto OpenClaw w Matrix, które wysyła odpowiedź
- w poniższych wywołaniach API użyj tokenu dostępu użytkownika będącego odbiorcą
- w regule powiadomień dopasuj `sender` do pełnego identyfikatora MXID użytkownika będącego botem
- konto odbiorcy musi już mieć działające elementy pusher; reguły cichych podglądów działają tylko wtedy, gdy standardowe dostarczanie powiadomień push przez Matrix działa prawidłowo

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

  <Step title="Uzyskaj token dostępu odbiorcy">
    Jeśli to możliwe, użyj ponownie tokenu istniejącej sesji klienta. Aby wygenerować nowy:

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

  <Step title="Sprawdź, czy istnieją elementy pusher">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Jeśli odpowiedź nie zawiera żadnych elementów pusher, przed kontynuowaniem napraw standardowe dostarczanie powiadomień push przez Matrix dla tego konta.

  </Step>

  <Step title="Zainstaluj nadrzędną regułę powiadomień">
    Zainstaluj regułę dopasowującą znacznik sfinalizowanego podglądu oraz MXID bota jako nadawcę:

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

    Przed uruchomieniem zastąp:

    - `https://matrix.example.org`: podstawowy adres URL Twojego serwera macierzystego
    - `$USER_ACCESS_TOKEN`: token dostępu użytkownika będącego odbiorcą
    - `openclaw-finalized-preview-botname`: identyfikator reguły unikatowy dla każdego bota i odbiorcy (wzorzec: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: MXID Twojego bota OpenClaw, a nie odbiorcy

  </Step>

  <Step title="Zweryfikuj">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Następnie przetestuj odpowiedź przesyłaną strumieniowo. W trybie cichym w pokoju jest wyświetlany cichy podgląd wersji roboczej, a powiadomienie pojawia się po zakończeniu bloku lub tury.

  </Step>
</Steps>

Aby później usunąć regułę, wyślij żądanie `DELETE` pod ten sam adres URL reguły, używając tokenu odbiorcy.

## Uwagi dotyczące wielu botów

Reguły powiadomień są identyfikowane przez `ruleId`: ponowne wysłanie żądania `PUT` dla tego samego identyfikatora aktualizuje pojedynczą regułę. Jeśli wiele botów OpenClaw ma powiadamiać tego samego odbiorcę, utwórz osobną regułę dla każdego bota, z odrębnym dopasowaniem nadawcy.

Nowe, zdefiniowane przez użytkownika reguły `override` są wstawiane przed domyślnymi regułami serwera wyłączającymi powiadomienia, dlatego dodatkowy parametr kolejności nie jest potrzebny. Reguła wpływa wyłącznie na edycje podglądu zawierające sam tekst, które można sfinalizować w miejscu; odpowiedzi z multimediami, mechanizmy awaryjne dla nieaktualnych podglądów oraz końcowe teksty, które aktywowałyby wzmianki Matrix, są zamiast tego dostarczane jako zwykłe wiadomości generujące powiadomienia.

## Uwagi dotyczące serwera macierzystego

<AccordionGroup>
  <Accordion title="Synapse">
    Nie jest wymagana żadna specjalna zmiana w `homeserver.yaml`. Jeśli standardowe powiadomienia Matrix już docierają do tego użytkownika, głównym krokiem konfiguracji jest użycie tokenu odbiorcy i wykonanie powyższego wywołania `pushrules`.

    Jeśli Synapse działa za odwrotnym serwerem proxy lub korzysta z procesów roboczych, upewnij się, że żądania `/_matrix/client/.../pushrules/` prawidłowo docierają do Synapse. Dostarczaniem powiadomień push zajmuje się proces główny albo `synapse.app.pusher` lub skonfigurowane procesy robocze pusher — upewnij się, że działają prawidłowo.

    Reguła używa warunku `event_property_is` reguły powiadomień (MSC3758, reguła powiadomień w wersji 1.10), który dodano do Synapse w 2023 roku. Starsze wersje Synapse akceptują wywołanie `PUT pushrules/...`, ale warunek nigdy nie zostaje dopasowany i nie pojawia się żaden komunikat o błędzie — zaktualizuj Synapse, jeśli po sfinalizowanej edycji podglądu nie pojawia się powiadomienie.

  </Accordion>

  <Accordion title="Tuwunel">
    Przebieg jest taki sam jak w przypadku Synapse; znacznik sfinalizowanego podglądu nie wymaga konfiguracji specyficznej dla Tuwunel.

    Jeśli powiadomienia znikają, gdy użytkownik jest aktywny na innym urządzeniu, sprawdź, czy opcja `suppress_push_when_active` jest włączona. Tuwunel dodał tę opcję w wersji 1.4.2 (we wrześniu 2025 roku) i może ona celowo wyłączać powiadomienia push na innych urządzeniach, gdy jedno urządzenie jest aktywne.

  </Accordion>
</AccordionGroup>

## Powiązane materiały

- [Konfiguracja kanału Matrix](/pl/channels/matrix)
- [Pojęcia związane z przesyłaniem strumieniowym](/pl/concepts/streaming)
