---
read_when:
    - Zmiana routingu kanałów lub zachowania skrzynki odbiorczej
summary: Reguły routingu dla poszczególnych kanałów (WhatsApp, Telegram, Discord, Slack) oraz współdzielony kontekst
title: Routing kanałów
x-i18n:
    generated_at: "2026-04-30T09:36:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: c43347048fcfd137cc3a0b2cfdc4cf36426fdcf9645f2d1a05ce9cf49688cf0d
    source_path: channels/channel-routing.md
    workflow: 16
---

# Kanały i routing

OpenClaw kieruje odpowiedzi **z powrotem do kanału, z którego przyszła wiadomość**. Model nie wybiera kanału; routing jest deterministyczny i kontrolowany przez konfigurację hosta.

## Kluczowe terminy

- **Kanał**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, oraz kanały pluginów. `webchat` to wewnętrzny kanał UI WebChat i nie jest konfigurowalnym kanałem wychodzącym.
- **AccountId**: instancja konta dla danego kanału (gdy jest obsługiwana).
- Opcjonalne domyślne konto kanału: `channels.<channel>.defaultAccount` wybiera, które konto jest używane, gdy ścieżka wychodząca nie określa `accountId`.
  - W konfiguracjach z wieloma kontami ustaw jawne konto domyślne (`defaultAccount` lub `accounts.default`), gdy skonfigurowano co najmniej dwa konta. Bez tego routing awaryjny może wybrać pierwszy znormalizowany identyfikator konta.
- **AgentId**: izolowany obszar roboczy + magazyn sesji („mózg”).
- **SessionKey**: klucz zasobnika używany do przechowywania kontekstu i kontroli współbieżności.

## Kształty kluczy sesji (przykłady)

Wiadomości bezpośrednie domyślnie zwijają się do sesji **main** agenta:

- `agent:<agentId>:<mainKey>` (domyślnie: `agent:main:main`)

Nawet gdy historia rozmów w wiadomościach bezpośrednich jest współdzielona z main, polityka sandboxa i narzędzi używa pochodnego klucza wykonawczego czatu bezpośredniego dla konta w przypadku zewnętrznych wiadomości DM, aby wiadomości pochodzące z kanału nie były traktowane jak lokalne uruchomienia sesji main.

Grupy i kanały pozostają izolowane per kanał:

- Grupy: `agent:<agentId>:<channel>:group:<id>`
- Kanały/pokoje: `agent:<agentId>:<channel>:channel:<id>`

Wątki:

- Wątki Slack/Discord dołączają `:thread:<threadId>` do klucza bazowego.
- Tematy forum Telegram osadzają `:topic:<topicId>` w kluczu grupy.

Przykłady:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Przypinanie trasy głównego DM

Gdy `session.dmScope` ma wartość `main`, wiadomości bezpośrednie mogą współdzielić jedną sesję main. Aby zapobiec nadpisaniu `lastRoute` sesji przez wiadomości DM od osób niebędących właścicielem, OpenClaw wnioskuje przypiętego właściciela z `allowFrom`, gdy spełnione są wszystkie poniższe warunki:

- `allowFrom` ma dokładnie jeden wpis niebędący wieloznacznikiem.
- Wpis można znormalizować do konkretnego identyfikatora nadawcy dla tego kanału.
- Nadawca przychodzącego DM nie pasuje do tego przypiętego właściciela.

W przypadku takiej niezgodności OpenClaw nadal zapisuje metadane sesji przychodzącej, ale pomija aktualizację `lastRoute` sesji main.

## Chronione rejestrowanie przychodzące

Pluginy kanałów mogą oznaczyć rekord sesji przychodzącej jako `createIfMissing: false`, gdy chroniona ścieżka nie może tworzyć nowej sesji OpenClaw. W tym trybie OpenClaw może aktualizować metadane i `lastRoute` istniejącej sesji, ale nie tworzy wpisu sesji zawierającego tylko trasę wyłącznie dlatego, że zaobserwowano wiadomość.

## Reguły routingu (jak wybierany jest agent)

Routing wybiera **jednego agenta** dla każdej wiadomości przychodzącej:

1. **Dokładne dopasowanie peera** (`bindings` z `peer.kind` + `peer.id`).
2. **Dopasowanie peera nadrzędnego** (dziedziczenie wątku).
3. **Dopasowanie gildii + ról** (Discord) przez `guildId` + `roles`.
4. **Dopasowanie gildii** (Discord) przez `guildId`.
5. **Dopasowanie zespołu** (Slack) przez `teamId`.
6. **Dopasowanie konta** (`accountId` w kanale).
7. **Dopasowanie kanału** (dowolne konto w tym kanale, `accountId: "*"`).
8. **Domyślny agent** (`agents.list[].default`, w przeciwnym razie pierwszy wpis listy, awaryjnie `main`).

Gdy powiązanie zawiera wiele pól dopasowania (`peer`, `guildId`, `teamId`, `roles`), **wszystkie podane pola muszą pasować**, aby to powiązanie zostało zastosowane.

Dopasowany agent określa, który obszar roboczy i magazyn sesji są używane.

## Grupy rozgłoszeniowe (uruchamianie wielu agentów)

Grupy rozgłoszeniowe pozwalają uruchamiać **wielu agentów** dla tego samego peera **wtedy, gdy OpenClaw normalnie by odpowiedział** (na przykład: w grupach WhatsApp po bramkowaniu wzmianki/aktywacji).

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

Zobacz: [Grupy rozgłoszeniowe](/pl/channels/broadcast-groups).

## Przegląd konfiguracji

- `agents.list`: nazwane definicje agentów (obszar roboczy, model itd.).
- `bindings`: mapuje kanały/konta/peerów przychodzących na agentów.

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

Możesz nadpisać ścieżkę magazynu przez `session.store` i szablonowanie `{agentId}`.

Wykrywanie sesji przez Gateway i ACP skanuje również dyskowe magazyny agentów pod domyślnym katalogiem głównym `agents/` oraz pod szablonowanymi katalogami głównymi `session.store`. Wykryte magazyny muszą pozostawać wewnątrz tego rozwiązanego katalogu głównego agenta i używać zwykłego pliku `sessions.json`. Dowiązania symboliczne i ścieżki poza katalogiem głównym są ignorowane.

## Zachowanie WebChat

WebChat dołącza do **wybranego agenta** i domyślnie używa głównej sesji agenta. Dzięki temu WebChat pozwala zobaczyć kontekst między kanałami dla tego agenta w jednym miejscu.

## Kontekst odpowiedzi

Odpowiedzi przychodzące obejmują:

- `ReplyToId`, `ReplyToBody` i `ReplyToSender`, gdy są dostępne.
- Cytowany kontekst jest dołączany do `Body` jako blok `[Replying to ...]`.

Jest to spójne we wszystkich kanałach.

## Powiązane

- [Grupy](/pl/channels/groups)
- [Grupy rozgłoszeniowe](/pl/channels/broadcast-groups)
- [Parowanie](/pl/channels/pairing)
