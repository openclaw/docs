---
read_when:
    - Konfigurowanie cichego strumieniowania Matrix dla samodzielnie hostowanego Synapse lub Tuwunel
    - Użytkownicy chcą powiadomień tylko o ukończonych blokach, a nie o każdej edycji podglądu
summary: Reguły powiadomień push Matrix dla poszczególnych odbiorców dotyczące cichych edycji sfinalizowanego podglądu
title: Reguły powiadomień push Matrix dla cichych podglądów
x-i18n:
    generated_at: "2026-07-16T18:13:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1c58e7e796c3ae6d1ee25de229e4592ab8b4fb4d0d50a9cf868ab5ef35b1dab5
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

Gdy `channels.matrix.streaming.mode` ma wartość `"quiet"`, OpenClaw przesyła strumieniowo odpowiedź, edytując w miejscu jedno zdarzenie podglądu. Podglądy są wysyłane jako niewywołujące powiadomień zdarzenia `m.notice`, a ukończona edycja jest oznaczana za pomocą `content["com.openclaw.finalized_preview"] = true`. Klienty Matrix powiadamiają o tej końcowej edycji tylko wtedy, gdy reguła powiadomień użytkownika pasuje do znacznika. Ta strona jest przeznaczona dla operatorów samodzielnie hostujących Matrix, którzy chcą zainstalować tę regułę dla każdego konta odbiorcy.

`streaming.mode: "progress"` finalizuje swoje wersje robocze tą samą ścieżką, dlatego ta sama reguła jest również wyzwalana dla ukończonych edycji w trybie postępu.

Aby korzystać wyłącznie ze standardowego działania powiadomień Matrix, należy użyć `streaming.mode: "partial"` lub pozostawić przesyłanie strumieniowe wyłączone. Zobacz [konfigurację kanału Matrix](/pl/channels/matrix#streaming-previews).

## Wymagania wstępne

- użytkownik odbiorcy = osoba, która powinna otrzymać powiadomienie
- użytkownik bota = konto OpenClaw w Matrix, które wysyła odpowiedź
- w poniższych wywołaniach API należy użyć tokenu dostępu użytkownika odbiorcy
- wartość `sender` w regule powiadomień należy dopasować do pełnego identyfikatora MXID użytkownika bota
- konto odbiorcy musi już mieć działające mechanizmy pusher; reguły cichych podglądów działają tylko wtedy, gdy standardowe dostarczanie powiadomień push Matrix działa prawidłowo

## Kroki

<Steps>
  <Step title="Skonfiguruj ciche podglądy">

```json5
{
  channels: {
    matrix: {
      streaming: { mode: "quiet" },
    },
  },
}
```

  </Step>

  <Step title="Uzyskaj token dostępu odbiorcy">
    W miarę możliwości należy ponownie użyć istniejącego tokenu sesji klienta. Aby wygenerować nowy:

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

  <Step title="Sprawdź, czy istnieją mechanizmy pusher">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Jeśli odpowiedź nie zawiera żadnych mechanizmów pusher, przed kontynuowaniem należy naprawić standardowe dostarczanie powiadomień push Matrix dla tego konta.

  </Step>

  <Step title="Zainstaluj nadrzędną regułę powiadomień">
    Zainstaluj regułę dopasowującą znacznik ukończonego podglądu oraz MXID bota jako nadawcę:

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

    - `https://matrix.example.org`: podstawowy adres URL serwera domowego
    - `$USER_ACCESS_TOKEN`: token dostępu użytkownika odbiorcy
    - `openclaw-finalized-preview-botname`: identyfikator reguły unikatowy dla każdego bota i odbiorcy (wzorzec: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: MXID bota OpenClaw, a nie odbiorcy

  </Step>

  <Step title="Zweryfikuj">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Następnie przetestuj odpowiedź przesyłaną strumieniowo. W trybie cichym pokój wyświetla cichy podgląd wersji roboczej i wysyła powiadomienie po zakończeniu bloku lub tury.

  </Step>
</Steps>

Aby później usunąć regułę, należy wykonać `DELETE` dla tego samego adresu URL reguły przy użyciu tokenu odbiorcy.

## Uwagi dotyczące wielu botów

Kluczem reguł powiadomień jest `ruleId`: ponowne wykonanie `PUT` dla tego samego identyfikatora aktualizuje jedną regułę. Jeśli wiele botów OpenClaw ma powiadamiać tego samego odbiorcę, należy utworzyć osobną regułę dla każdego bota z odrębnym dopasowaniem nadawcy.

Nowe reguły użytkownika `override` są wstawiane przed domyślnymi regułami serwera wyciszającymi powiadomienia, dlatego dodatkowy parametr kolejności nie jest potrzebny. Reguła wpływa wyłącznie na tekstowe edycje podglądu, które można ukończyć w miejscu; odpowiedzi z multimediami, mechanizmy awaryjne dla nieaktualnego podglądu oraz teksty końcowe, które aktywowałyby wzmianki Matrix, są zamiast tego dostarczane jako zwykłe wiadomości wywołujące powiadomienia.

## Uwagi dotyczące serwera domowego

<AccordionGroup>
  <Accordion title="Synapse">
    Nie jest wymagana żadna specjalna zmiana `homeserver.yaml`. Jeśli standardowe powiadomienia Matrix już docierają do tego użytkownika, głównym krokiem konfiguracji jest token odbiorcy oraz powyższe wywołanie `pushrules`.

    Jeśli Synapse działa za odwrotnym serwerem proxy lub korzysta z procesów roboczych, należy upewnić się, że `/_matrix/client/.../pushrules/` prawidłowo dociera do Synapse. Dostarczaniem powiadomień push zajmuje się proces główny albo `synapse.app.pusher` / skonfigurowane procesy robocze pusher — należy upewnić się, że działają prawidłowo.

    Reguła używa warunku reguły powiadomień `event_property_is` (MSC3758, reguła powiadomień v1.10), który dodano do Synapse w 2023 roku. Starsze wersje Synapse akceptują wywołanie `PUT pushrules/...`, ale bez komunikatu nigdy nie dopasowują warunku — jeśli po ukończonej edycji podglądu nie pojawia się powiadomienie, należy uaktualnić Synapse.

  </Accordion>

  <Accordion title="Tuwunel">
    Obowiązuje ten sam proces co w przypadku Synapse; znacznik ukończonego podglądu nie wymaga konfiguracji specyficznej dla Tuwunel.

    Jeśli powiadomienia znikają, gdy użytkownik jest aktywny na innym urządzeniu, należy sprawdzić, czy włączono `suppress_push_when_active`. Tuwunel dodał tę opcję w wersji 1.4.2 (wrzesień 2025) i może ona celowo wyciszać powiadomienia push na innych urządzeniach, gdy jedno z nich jest aktywne.

  </Accordion>
</AccordionGroup>

## Powiązane

- [Konfiguracja kanału Matrix](/pl/channels/matrix)
- [Pojęcia dotyczące przesyłania strumieniowego](/pl/concepts/streaming)
