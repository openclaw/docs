---
read_when:
    - Chcesz połączyć OpenClaw z kanałami IRC lub wiadomościami prywatnymi
    - Konfigurujesz listy dozwolonych użytkowników IRC, zasady grupy lub wymóg wzmianki
summary: Konfiguracja pluginu IRC, kontrola dostępu i rozwiązywanie problemów
title: IRC
x-i18n:
    generated_at: "2026-07-12T14:48:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23e288f18a57a3ee74a433feb1ffb7dda0480f998cf74d4ec825bd7f3c0745c5
    source_path: channels/irc.md
    workflow: 16
---

Użyj IRC, gdy chcesz korzystać z OpenClaw w klasycznych kanałach (`#room`) i wiadomościach bezpośrednich.
Zainstaluj oficjalny plugin IRC, a następnie skonfiguruj go w sekcji `channels.irc`.

## Szybki start

1. Zainstaluj plugin:

```bash
openclaw plugins install @openclaw/irc
```

2. Ustaw co najmniej host, pseudonim oraz kanały, do których bot ma dołączyć, w pliku `~/.openclaw/openclaw.json`:

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

3. Uruchom lub ponownie uruchom Gateway:

```bash
openclaw gateway run
```

Do koordynacji botów preferuj prywatny serwer IRC. Jeśli świadomie korzystasz z publicznej sieci IRC, popularne opcje to Libera.Chat, OFTC i Snoonet. Unikaj przewidywalnych kanałów publicznych do komunikacji zaplecza botów lub roju.

## Ustawienia połączenia

| Klucz                         | Wartość domyślna              | Uwagi                                                               |
| ----------------------------- | ----------------------------- | ------------------------------------------------------------------- |
| `host`                        | brak (wymagany)               | Nazwa hosta serwera IRC                                             |
| `port`                        | `6697` z TLS, `6667` bez TLS  | 1–65535                                                             |
| `tls`                         | `true`                        | Ustaw `false` tylko w przypadku świadomego użycia tekstu jawnego    |
| `nick`                        | brak (wymagany)               | Pseudonim bota                                                      |
| `username`                    | pseudonim, w przeciwnym razie `openclaw` | Nazwa użytkownika IRC                                  |
| `realname`                    | `OpenClaw`                    | Pole prawdziwej nazwy/GECOS                                         |
| `password` / `passwordFile`   | brak                          | Hasło serwera; plik musi być zwykłym plikiem                        |
| `channels`                    | brak                          | Kanały, do których bot ma dołączyć (`["#openclaw"]`)                |
| `accounts` / `defaultAccount` | brak                          | Konfiguracja wielu kont; zmienne środowiskowe uzupełniają tylko konto domyślne |

## Domyślne ustawienia zabezpieczeń

- IRC używa bezpośrednich gniazd TCP/TLS poza routingiem wychodzącego serwera proxy zarządzanym przez operatora OpenClaw. We wdrożeniach wymagających kierowania całego ruchu wychodzącego przez ten serwer proxy ustaw `channels.irc.enabled=false`, chyba że bezpośredni ruch wychodzący IRC został wyraźnie zatwierdzony.
- Domyślną wartością `channels.irc.dmPolicy` jest `"pairing"`: nieznani nadawcy wiadomości bezpośrednich otrzymują kod parowania, który zatwierdzasz poleceniem `openclaw pairing approve irc <code>`.
- Domyślną wartością `channels.irc.groupPolicy` jest `"allowlist"`.
- Gdy `groupPolicy="allowlist"`, ustaw `channels.irc.groups`, aby zdefiniować dozwolone kanały.
- Używaj TLS (`channels.irc.tls=true`), chyba że świadomie akceptujesz przesyłanie tekstem jawnym.

## Kontrola dostępu

Dla kanałów IRC istnieją dwie oddzielne „bramki”:

1. **Dostęp do kanału** (`groupPolicy` + `groups`): określa, czy bot w ogóle przyjmuje wiadomości z danego kanału.
2. **Dostęp nadawcy** (`groupAllowFrom` / `groups["#channel"].allowFrom` dla poszczególnych kanałów): określa, kto może uruchamiać bota na danym kanale.

Klucze konfiguracji:

- Lista dozwolonych nadawców wiadomości bezpośrednich (dostęp nadawcy): `channels.irc.allowFrom`
- Lista dozwolonych nadawców grupowych (dostęp nadawcy na kanale): `channels.irc.groupAllowFrom`
- Ustawienia poszczególnych kanałów (reguły kanału, nadawcy i wzmianek): `channels.irc.groups["#channel"]` z kluczami `requireMention`, `allowFrom`, `enabled`, `tools`, `toolsBySender`, `skills` i `systemPrompt`
- `channels.irc.groupPolicy="open"` zezwala na nieskonfigurowane kanały (**domyślnie nadal wymaga wzmianki**)

Wpisy na liście dozwolonych powinny używać stabilnych tożsamości nadawców (`nick!user@host`).
Dopasowywanie wyłącznie pseudonimu jest podatne na zmiany i zostaje włączone tylko wtedy, gdy ustawiono `channels.irc.dangerouslyAllowNameMatching: true`.

### Częsta pułapka: `allowFrom` dotyczy wiadomości bezpośrednich, a nie kanałów

Jeśli widzisz wpisy dziennika takie jak:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...oznacza to, że nadawca nie był dozwolony dla wiadomości **grupowych/kanałowych**. Napraw to, wykonując jedną z następujących czynności:

- ustaw `channels.irc.groupAllowFrom` (globalnie dla wszystkich kanałów) albo
- ustaw listy dozwolonych nadawców dla poszczególnych kanałów: `channels.irc.groups["#channel"].allowFrom`

Przykład (zezwolenie wszystkim osobom na kanale `#openclaw` na komunikację z botem):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Wyzwalanie odpowiedzi (wzmianki)

Nawet jeśli kanał jest dozwolony (za pomocą `groupPolicy` + `groups`) i nadawca jest dozwolony, OpenClaw domyślnie **wymaga wzmianki** w kontekstach grupowych. Bot uznaje, że został wspomniany, gdy wiadomość zawiera pseudonim połączonego bota lub pasuje do skonfigurowanych wzorców wzmianek.

Oznacza to, że możesz zobaczyć wpisy dziennika takie jak `drop channel … (missing-mention)`, jeśli wiadomość nie zawiera wzorca wzmianki pasującego do bota.

Aby bot odpowiadał na kanale IRC **bez konieczności używania wzmianki**, wyłącz wymóg wzmianki dla tego kanału:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

Aby zezwolić na **wszystkie** kanały IRC (bez listy dozwolonych kanałów) i nadal odpowiadać bez wzmianek:

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## Uwaga dotycząca bezpieczeństwa (zalecenie dla kanałów publicznych)

Jeśli zezwolisz na `allowFrom: ["*"]` na kanale publicznym, każdy będzie mógł wysyłać polecenia do bota.
Aby ograniczyć ryzyko, ogranicz narzędzia dla tego kanału.

### Te same narzędzia dla wszystkich osób na kanale

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### Różne narzędzia dla poszczególnych nadawców (właściciel ma większe uprawnienia)

Użyj `toolsBySender`, aby zastosować bardziej restrykcyjne zasady do `"*"`, a mniej restrykcyjne do swojego pseudonimu:

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:alice": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

Uwagi:

- Klucze `toolsBySender` powinny używać jawnych prefiksów (`channel:`, `id:`, `e164:`, `username:`, `name:`). W przypadku IRC użyj `id:` z wartością tożsamości nadawcy: `id:alice` lub `id:alice!~alice@203.0.113.7`, aby uzyskać dokładniejsze dopasowanie.
- Starsze klucze bez prefiksu są nadal akceptowane, dopasowywane wyłącznie jako `id:` i powodują wyświetlenie ostrzeżenia o wycofaniu.
- Obowiązują pierwsze pasujące zasady nadawcy; `"*"` jest rezerwowym symbolem wieloznacznym.

Więcej informacji o dostępie grupowym, wymaganiu wzmianki i ich wzajemnym oddziaływaniu znajdziesz tutaj: [/channels/groups](/pl/channels/groups).

## NickServ

Aby uwierzytelnić się w NickServ po nawiązaniu połączenia:

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

Uwierzytelnianie w NickServ jest domyślnie wykonywane zawsze, gdy ustawiono hasło (`enabled` trzeba ustawić na `false` tylko w celu rezygnacji). Domyślną wartością `service` jest `NickServ`; `passwordFile` stanowi alternatywę dla hasła `password` umieszczonego bezpośrednio w konfiguracji.

Opcjonalna jednorazowa rejestracja podczas łączenia (`register: true` wymaga `registerEmail`):

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

Po zarejestrowaniu pseudonimu wyłącz `register`, aby uniknąć wielokrotnych prób wykonania polecenia REGISTER.

## Zmienne środowiskowe

Konto domyślne obsługuje:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (wartości rozdzielone przecinkami)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

Nie można ustawić `IRC_HOST` za pomocą pliku `.env` obszaru roboczego; zobacz [Pliki `.env` obszaru roboczego](/pl/gateway/security).

## Rozwiązywanie problemów

- Jeśli bot łączy się, ale nigdy nie odpowiada na kanałach, sprawdź `channels.irc.groups` **oraz** czy wymóg wzmianki nie powoduje odrzucania wiadomości (`missing-mention`). Jeśli chcesz, aby odpowiadał bez oznaczania go, ustaw `requireMention:false` dla danego kanału.
- Jeśli logowanie się nie powiedzie, sprawdź dostępność pseudonimu i hasło serwera.
- Jeśli TLS nie działa w niestandardowej sieci, sprawdź host, port i konfigurację certyfikatu.

## Powiązane materiały

- [Przegląd kanałów](/pl/channels) — wszystkie obsługiwane kanały
- [Parowanie](/pl/channels/pairing) — uwierzytelnianie wiadomości bezpośrednich i proces parowania
- [Grupy](/pl/channels/groups) — zachowanie czatu grupowego i wymóg wzmianki
- [Routing kanałów](/pl/channels/channel-routing) — routing sesji dla wiadomości
- [Bezpieczeństwo](/pl/gateway/security) — model dostępu i wzmacnianie zabezpieczeń
