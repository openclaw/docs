---
read_when:
    - Podczas zmiany routingu kanałów lub zachowania skrzynki odbiorczej
summary: Reguły routingu dla każdego kanału (WhatsApp, Telegram, Discord, Slack) oraz współdzielony kontekst
title: Routing kanałów
x-i18n:
    generated_at: "2026-04-05T13:42:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63916c4dd0af5fc9bbd12581a9eb15fea14a380c5ade09323ca0c237db61e537
    source_path: channels/channel-routing.md
    workflow: 15
---

# Kanały i routing

OpenClaw kieruje odpowiedzi **z powrotem do kanału, z którego przyszła wiadomość**. Model nie wybiera kanału; routing jest deterministyczny i kontrolowany przez konfigurację hosta.

## Kluczowe terminy

- **Kanał**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line` oraz kanały rozszerzeń. `webchat` to wewnętrzny kanał interfejsu WebChat i nie jest konfigurowalnym kanałem wychodzącym.
- **AccountId**: instancja konta dla danego kanału (gdy jest obsługiwana).
- Opcjonalne domyślne konto kanału: `channels.<channel>.defaultAccount` określa, które konto jest używane, gdy ścieżka wychodząca nie podaje `accountId`.
  - W konfiguracjach wielokontowych ustaw jawne domyślne konto (`defaultAccount` lub `accounts.default`), gdy skonfigurowane są co najmniej dwa konta. Bez tego routing zapasowy może wybrać pierwszy znormalizowany identyfikator konta.
- **AgentId**: izolowany obszar roboczy + magazyn sesji („brain”).
- **SessionKey**: klucz zasobnika używany do przechowywania kontekstu i kontrolowania współbieżności.

## Kształty kluczy sesji (przykłady)

Wiadomości bezpośrednie są zwijane do sesji **main** agenta:

- `agent:<agentId>:<mainKey>` (domyślnie: `agent:main:main`)

Grupy i kanały pozostają odizolowane dla każdego kanału:

- Grupy: `agent:<agentId>:<channel>:group:<id>`
- Kanały/pokoje: `agent:<agentId>:<channel>:channel:<id>`

Wątki:

- Wątki Slack/Discord dopisują `:thread:<threadId>` do klucza bazowego.
- Tematy forum Telegram osadzają `:topic:<topicId>` w kluczu grupy.

Przykłady:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Przypinanie głównej trasy DM

Gdy `session.dmScope` ma wartość `main`, wiadomości bezpośrednie mogą współdzielić jedną główną sesję.
Aby zapobiec nadpisaniu `lastRoute` sesji przez DM od użytkowników niebędących właścicielem,
OpenClaw wywnioskuje przypiętego właściciela z `allowFrom`, gdy wszystkie poniższe warunki są spełnione:

- `allowFrom` ma dokładnie jeden wpis bez symboli wieloznacznych.
- Wpis można znormalizować do konkretnego identyfikatora nadawcy dla tego kanału.
- Nadawca przychodzącej wiadomości DM nie pasuje do tego przypiętego właściciela.

W przypadku takiej niezgodności OpenClaw nadal zapisuje metadane sesji przychodzącej, ale pomija aktualizację `lastRoute` głównej sesji.

## Reguły routingu (jak wybierany jest agent)

Routing wybiera **jednego agenta** dla każdej wiadomości przychodzącej:

1. **Dokładne dopasowanie peera** (`bindings` z `peer.kind` + `peer.id`).
2. **Dopasowanie peera nadrzędnego** (dziedziczenie wątku).
3. **Dopasowanie guild + roles** (Discord) przez `guildId` + `roles`.
4. **Dopasowanie guild** (Discord) przez `guildId`.
5. **Dopasowanie team** (Slack) przez `teamId`.
6. **Dopasowanie konta** (`accountId` w kanale).
7. **Dopasowanie kanału** (dowolne konto w tym kanale, `accountId: "*"`).
8. **Domyślny agent** (`agents.list[].default`, w przeciwnym razie pierwszy wpis listy, a ostatecznie `main`).

Gdy powiązanie zawiera wiele pól dopasowania (`peer`, `guildId`, `teamId`, `roles`), **wszystkie podane pola muszą pasować**, aby to powiązanie miało zastosowanie.

Dopasowany agent określa, który obszar roboczy i magazyn sesji są używane.

## Grupy rozgłoszeniowe (uruchamianie wielu agentów)

Grupy rozgłoszeniowe pozwalają uruchomić **wielu agentów** dla tego samego peera **gdy OpenClaw normalnie odpowiedziałby** (na przykład w grupach WhatsApp po przejściu bramkowania wzmianki/aktywacji).

Konfiguracja:

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

Zobacz: [Broadcast Groups](/channels/broadcast-groups).

## Przegląd konfiguracji

- `agents.list`: nazwane definicje agentów (obszar roboczy, model itd.).
- `bindings`: mapuje przychodzące kanały/konta/peerów na agentów.

Przykład:

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## Przechowywanie sesji

Magazyny sesji znajdują się w katalogu stanu (domyślnie `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkrypty JSONL znajdują się obok magazynu

Możesz zastąpić ścieżkę magazynu za pomocą `session.store` i szablonowania `{agentId}`.

Odkrywanie sesji Gateway i ACP skanuje również magazyny agentów oparte na dysku pod domyślnym katalogiem głównym `agents/` oraz pod katalogami głównymi `session.store` opartymi na szablonach. Odkryte magazyny muszą pozostawać w obrębie tego rozwiązanego katalogu głównego agenta i używać zwykłego pliku `sessions.json`. Dowiązania symboliczne i ścieżki poza katalogiem głównym są ignorowane.

## Zachowanie WebChat

WebChat dołącza do **wybranego agenta** i domyślnie korzysta z głównej sesji agenta. Dzięki temu WebChat pozwala zobaczyć kontekst międzykanałowy tego agenta w jednym miejscu.

## Kontekst odpowiedzi

Odpowiedzi przychodzące zawierają:

- `ReplyToId`, `ReplyToBody` i `ReplyToSender`, gdy są dostępne.
- Cytowany kontekst jest dołączany do `Body` jako blok `[Replying to ...]`.

Jest to spójne we wszystkich kanałach.
