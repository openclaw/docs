---
read_when:
    - Chcesz połączyć OpenClaw z LINE
    - Wymagane jest skonfigurowanie LINE Webhook + danych uwierzytelniających
    - Chcesz opcji wiadomości specyficznych dla LINE
summary: 'LINE Messaging API Plugin: instalacja, konfiguracja i użycie'
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:33:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d54b6740c3403d8fb2e815d969d891973d88c2e2ff43e9de7642c1c81d36e090
    source_path: hi/channels/line.md
    workflow: 16
---

LINE łączy się z OpenClaw przez LINE Messaging API. Plugin działa jako odbiornik Webhook
w Gateway i używa Twoich channel access token + channel secret do
uwierzytelniania.

Status: Plugin do pobrania. Obsługiwane są direct messages, group chats, media, locations, Flex
messages, template messages i quick replies. Reactions i threads
nie są obsługiwane.

## Instalacja

Zainstaluj LINE przed skonfigurowaniem channel:

```bash
openclaw plugins install @openclaw/line
```

Lokalny checkout (gdy uruchamiasz z repozytorium git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Konfiguracja

1. Utwórz LINE Developers account i otwórz Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Utwórz (lub wybierz) Provider i dodaj channel **Messaging API**.
3. Skopiuj **Channel access token** i **Channel secret** z channel settings.
4. W Messaging API settings włącz **Use webhook**.
5. Ustaw Webhook URL na swój endpoint Gateway (wymagany jest HTTPS):

```
https://gateway-host/line/webhook
```

Gateway odpowiada na Webhook verification (GET) LINE i akceptuje podpisane
inbound events (POST) natychmiast po signature i payload validation; agent
processing jest kontynuowane asynchronicznie.
Jeśli potrzebujesz custom path, ustaw `channels.line.webhookPath` lub
`channels.line.accounts.<id>.webhookPath` i odpowiednio zaktualizuj URL.

Uwaga dotycząca bezpieczeństwa:

- LINE signature verification jest body-dependent (HMAC na raw body), więc OpenClaw wymusza strict pre-auth body limits i timeout przed verification.
- OpenClaw przetwarza Webhook events ze zweryfikowanych raw request bytes. W celu signature-integrity safety wartości `req.body` przekształcone przez upstream middleware są ignorowane.

## Konfigurowanie

Minimalna config:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

Publiczna config DM:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "open",
      allowFrom: ["*"],
    },
  },
}
```

Env vars (tylko default account):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Pliki token/secret:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` i `secretFile` powinny wskazywać regular files. Symlinks są odrzucane.

Wiele accounts:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## Kontrola dostępu

Direct messages domyślnie używają pairing. Nieznani senders otrzymują pairing code, a ich
messages są ignorowane do momentu zatwierdzenia.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlists i policies:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: allowlisted LINE user IDs dla DMs; dla `dmPolicy: "open"` wymagane jest `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: allowlisted LINE user IDs dla groups
- Per-group overrides: `channels.line.groups.<groupId>.allowFrom`
- Static sender access groups można odnosić przez `allowFrom`, `groupAllowFrom` i per-group `allowFrom` z `accessGroup:<name>`.
- Uwaga runtime: jeśli `channels.line` całkowicie brakuje, runtime fallbackuje do `groupPolicy="allowlist"` dla group checks (nawet jeśli ustawiono `channels.defaults.groupPolicy`).

LINE IDs rozróżniają wielkość liter. Valid IDs wyglądają tak:

- User: `U` + 32 hex chars
- Group: `C` + 32 hex chars
- Room: `R` + 32 hex chars

## Zachowanie wiadomości

- Text jest dzielony na chunks po 5000 characters.
- Markdown formatting jest usuwane; code blocks i tables są w miarę możliwości konwertowane na Flex
  cards.
- Streaming responses są buffered; gdy agent pracuje, LINE otrzymuje pełne chunks z loading
  animation.
- Media downloads są capped przez `channels.line.mediaMaxMb` (default 10).
- Inbound media są zapisywane pod `~/.openclaw/media/inbound/` przed przekazaniem do agenta,
  co odpowiada shared media store używanemu przez inne bundled channel
  plugins.

## Dane channel (rich messages)

Użyj `channelData.line`, aby wysyłać quick replies, locations, Flex cards lub template
messages.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

LINE Plugin dostarcza także command `/card` dla Flex message presets:

```
/card info "Welcome" "Thanks for joining!"
```

## Obsługa ACP

LINE obsługuje powiązania konwersacji ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` wiąże current LINE chat z ACP session bez tworzenia child thread.
- Configured ACP bindings i active conversation-bound ACP sessions działają w LINE tak jak inne conversation channels.

Szczegóły znajdziesz w [ACP agents](/pl/tools/acp-agents).

## Outbound media

LINE Plugin obsługuje wysyłanie images, videos i audio files przez agent message tool. Media są wysyłane przez LINE-specific delivery path z odpowiednią preview i tracking handling:

- **Images**: wysyłane jako LINE image messages z automatic preview generation.
- **Videos**: wysyłane z explicit preview i content-type handling.
- **Audio**: wysyłane jako LINE audio messages.

Outbound media URLs muszą być publicznymi HTTPS URLs. OpenClaw validate target hostname przed przekazaniem URL do LINE i odrzuca loopback, link-local oraz private-network targets.

Generic media sends fallbackują do existing image-only route, gdy LINE-specific path nie jest dostępny.

## Rozwiązywanie problemów

- **Webhook verification fails:** upewnij się, że Webhook URL używa HTTPS i
  `channelSecret` odpowiada temu w LINE console.
- **No inbound events:** potwierdź, że Webhook path odpowiada `channels.line.webhookPath`
  i Gateway jest reachable z LINE.
- **Media download errors:** jeśli media przekracza default limit, zwiększ `channels.line.mediaMaxMb`.

## Powiązane

- [Channels Overview](/pl/channels) — wszystkie obsługiwane channels
- [Pairing](/pl/channels/pairing) — DM authentication i pairing flow
- [Groups](/pl/channels/groups) — group chat behavior i mention gating
- [Channel Routing](/pl/channels/channel-routing) — session routing dla messages
- [Security](/pl/gateway/security) — access model i hardening
