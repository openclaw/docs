---
read_when:
    - Zmiana routingu kanałów lub zachowania skrzynki odbiorczej
summary: Reguły routingu dla każdego kanału (WhatsApp, Telegram, Discord, Slack) i współdzielony kontekst
title: Routing kanałów
x-i18n:
    generated_at: "2026-04-24T08:57:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb87a774bb094af15524702c2c4fd17cf0b41fe27ac0943d1008523a43d5553b
    source_path: channels/channel-routing.md
    workflow: 15
---

# Kanały i routing

OpenClaw kieruje odpowiedzi **z powrotem do kanału, z którego pochodzi wiadomość**. Model
nie wybiera kanału; routing jest deterministyczny i kontrolowany przez
konfigurację hosta.

## Kluczowe pojęcia

- **Kanał**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line` oraz kanały Plugin. `webchat` to wewnętrzny kanał interfejsu WebChat i nie jest konfigurowalnym kanałem wychodzącym.
- **AccountId**: instancja konta przypisana do kanału (gdy jest obsługiwana).
- Opcjonalne domyślne konto kanału: `channels.<channel>.defaultAccount` wybiera,
  które konto jest używane, gdy ścieżka wychodząca nie określa `accountId`.
  - W konfiguracjach z wieloma kontami ustaw jawne domyślne konto (`defaultAccount` lub `accounts.default`), gdy skonfigurowano dwa lub więcej kont. Bez tego routing zapasowy może wybrać pierwszy znormalizowany identyfikator konta.
- **AgentId**: izolowany obszar roboczy + magazyn sesji („mózg”).
- **SessionKey**: klucz zasobnika używany do przechowywania kontekstu i kontrolowania współbieżności.

## Kształty kluczy sesji (przykłady)

Wiadomości bezpośrednie są domyślnie zwijane do sesji **głównej** agenta:

- `agent:<agentId>:<mainKey>` (domyślnie: `agent:main:main`)

Nawet gdy historia rozmów wiadomości bezpośrednich jest współdzielona z sesją główną, polityka sandboxa i narzędzi używa pochodnego klucza środowiska wykonawczego czatu bezpośredniego per konto dla zewnętrznych DM,
aby wiadomości pochodzące z kanałów nie były traktowane jak lokalne uruchomienia sesji głównej.

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

Gdy `session.dmScope` ma wartość `main`, wiadomości bezpośrednie mogą współdzielić jedną sesję główną.
Aby zapobiec nadpisaniu `lastRoute` sesji przez wiadomości DM od nadawców innych niż właściciel,
OpenClaw wnioskuje przypiętego właściciela na podstawie `allowFrom`, gdy wszystkie te warunki są spełnione:

- `allowFrom` ma dokładnie jeden wpis bez symbolu wieloznacznego.
- Wpis można znormalizować do konkretnego identyfikatora nadawcy dla tego kanału.
- Nadawca przychodzącej wiadomości DM nie pasuje do tego przypiętego właściciela.

W przypadku takiej niezgodności OpenClaw nadal zapisuje metadane przychodzącej sesji, ale
pomija aktualizację `lastRoute` głównej sesji.

## Zasady routingu (jak wybierany jest agent)

Routing wybiera **jednego agenta** dla każdej przychodzącej wiadomości:

1. **Dokładne dopasowanie peera** (`bindings` z `peer.kind` + `peer.id`).
2. **Dopasowanie peera nadrzędnego** (dziedziczenie wątku).
3. **Dopasowanie guild + roles** (Discord) przez `guildId` + `roles`.
4. **Dopasowanie guild** (Discord) przez `guildId`.
5. **Dopasowanie team** (Slack) przez `teamId`.
6. **Dopasowanie konta** (`accountId` w kanale).
7. **Dopasowanie kanału** (dowolne konto w tym kanale, `accountId: "*"`).
8. **Agent domyślny** (`agents.list[].default`, w przeciwnym razie pierwszy wpis listy, a jako fallback `main`).

Gdy powiązanie zawiera wiele pól dopasowania (`peer`, `guildId`, `teamId`, `roles`), **wszystkie podane pola muszą pasować**, aby dane powiązanie miało zastosowanie.

Dopasowany agent określa, który obszar roboczy i magazyn sesji są używane.

## Grupy rozgłoszeniowe (uruchamianie wielu agentów)

Grupy rozgłoszeniowe pozwalają uruchomić **wielu agentów** dla tego samego peera **gdy OpenClaw normalnie by odpowiedział** (na przykład: w grupach WhatsApp, po wzmiance lub przejściu bramkowania aktywacji).

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

Zobacz: [Broadcast Groups](/pl/channels/broadcast-groups).

## Przegląd konfiguracji

- `agents.list`: nazwane definicje agentów (obszar roboczy, model itp.).
- `bindings`: mapuje przychodzące kanały/konta/peery na agentów.

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
- Transkrypcje JSONL znajdują się obok magazynu

Możesz nadpisać ścieżkę magazynu za pomocą `session.store` i szablonowania `{agentId}`.

Wykrywanie sesji Gateway i ACP skanuje także magazyny agentów oparte na dysku w
domyślnym katalogu głównym `agents/` oraz w katalogach głównych `session.store` opartych na szablonach. Wykryte
magazyny muszą pozostać wewnątrz tego rozwiązanego katalogu głównego agenta i używać zwykłego
pliku `sessions.json`. Dowiązania symboliczne i ścieżki poza katalogiem głównym są ignorowane.

## Zachowanie WebChat

WebChat dołącza do **wybranego agenta** i domyślnie używa głównej
sesji agenta. Dzięki temu WebChat pozwala zobaczyć międzykanałowy kontekst tego
agenta w jednym miejscu.

## Kontekst odpowiedzi

Przychodzące odpowiedzi zawierają:

- `ReplyToId`, `ReplyToBody` i `ReplyToSender`, gdy są dostępne.
- Cytowany kontekst jest dołączany do `Body` jako blok `[Replying to ...]`.

Jest to spójne we wszystkich kanałach.

## Powiązane

- [Groups](/pl/channels/groups)
- [Broadcast groups](/pl/channels/broadcast-groups)
- [Pairing](/pl/channels/pairing)
