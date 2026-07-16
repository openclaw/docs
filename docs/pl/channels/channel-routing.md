---
read_when:
    - Zmiana routingu kanałów lub działania skrzynki odbiorczej
summary: Reguły routingu dla poszczególnych kanałów (WhatsApp, Telegram, Discord, Slack) oraz współdzielony kontekst
title: Routing kanałów
x-i18n:
    generated_at: "2026-07-16T18:11:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4836671840e8c7919e7def8140d4a54fdeea17ddbe8c7a348ab5a23ff8b4213c
    source_path: channels/channel-routing.md
    workflow: 16
---

# Kanały i routing

OpenClaw kieruje odpowiedzi **z powrotem do kanału, z którego pochodzi wiadomość**. Model
nie wybiera kanału; routing jest deterministyczny i kontrolowany przez
konfigurację hosta.

## Kluczowe pojęcia

- **Kanał**: dołączony Plugin kanału, taki jak `discord`, `googlechat`, `imessage`, `irc`, `line`, `signal`, `slack`, `telegram` lub `whatsapp`, a także zainstalowane kanały Pluginów. `webchat` to wewnętrzny kanał interfejsu WebChat i nie jest konfigurowalnym kanałem wychodzącym.
- **AccountId**: instancja konta w danym kanale (jeśli jest obsługiwana).
- Opcjonalne domyślne konto kanału: `channels.<channel>.defaultAccount` określa,
  które konto jest używane, gdy ścieżka wychodząca nie określa `accountId`.
  - W konfiguracjach z wieloma kontami należy ustawić jawne konto domyślne (`defaultAccount` lub konto o nazwie `default`), gdy skonfigurowano co najmniej dwa konta. Bez niego routing awaryjny może wybrać pierwszy znormalizowany identyfikator konta.
- **AgentId**: izolowany obszar roboczy i magazyn sesji („mózg”).
- **SessionKey**: klucz zasobnika używany do przechowywania kontekstu i kontrolowania współbieżności.

## Prefiksy celów wychodzących

Jawne cele wychodzące mogą zawierać prefiks dostawcy, taki jak `telegram:123` lub `tg:123`. Rdzeń traktuje ten prefiks jako wskazówkę wyboru kanału tylko wtedy, gdy wybranym kanałem jest `last` lub kanał pozostaje nierozstrzygnięty, i tylko wtedy, gdy wczytany Plugin deklaruje obsługę tego prefiksu. Jeśli wywołujący wybrał już jawny kanał, prefiks dostawcy musi odpowiadać temu kanałowi; kombinacje międzykanałowe, takie jak dostarczenie przez WhatsApp do `telegram:123`, kończą się niepowodzeniem przed normalizacją celu właściwą dla Pluginu.

Prefiksy rodzaju celu i usługi, takie jak `channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>` i `sms:<number>`, pozostają częścią gramatyki wybranego kanału. Same nie wybierają dostawcy.

## Postacie kluczy sesji (przykłady)

Wiadomości bezpośrednie są domyślnie scalane z **główną** sesją agenta:

- `agent:<agentId>:<mainKey>` (domyślnie: `agent:main:main`)

`session.dmScope` steruje scalaniem wiadomości bezpośrednich: `main` (domyślnie) współdzieli jedną sesję główną,
natomiast `per-peer`, `per-channel-peer` i `per-account-channel-peer`
przechowują wiadomości bezpośrednie w oddzielnych sesjach. Powiązanie routingu może zastąpić zakres dla
pasujących partnerów za pomocą `bindings[].session.dmScope`.

Nawet gdy historia rozmów w wiadomościach bezpośrednich jest współdzielona z sesją główną, piaskownica i
zasady narzędzi używają pochodnego klucza środowiska wykonawczego czatu bezpośredniego dla każdego konta w przypadku zewnętrznych wiadomości bezpośrednich,
aby wiadomości pochodzące z kanału nie były traktowane jak lokalne uruchomienia sesji głównej.

Grupy i kanały pozostają odizolowane w obrębie poszczególnych kanałów:

- Grupy: `agent:<agentId>:<channel>:group:<id>`
- Kanały/pokoje: `agent:<agentId>:<channel>:channel:<id>`

Wątki:

- Wątki Slack/Discord dołączają `:thread:<threadId>` do klucza bazowego.
- Tematy forum Telegram osadzają `:topic:<topicId>` w kluczu grupy.

Przykłady:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Przypinanie routingu głównych wiadomości bezpośrednich

Gdy `session.dmScope` ma wartość `main`, wiadomości bezpośrednie mogą współdzielić jedną sesję główną.
Aby zapobiec nadpisaniu `lastRoute` sesji przez wiadomości bezpośrednie od osób innych niż właściciel,
OpenClaw wyznacza przypiętego właściciela na podstawie `allowFrom`, gdy spełnione są wszystkie poniższe warunki:

- `allowFrom` ma dokładnie jeden wpis bez symbolu wieloznacznego.
- Wpis można znormalizować do konkretnego identyfikatora nadawcy dla tego kanału.
- Nadawca przychodzącej wiadomości bezpośredniej nie odpowiada temu przypiętemu właścicielowi.

W przypadku takiej niezgodności OpenClaw nadal zapisuje metadane sesji przychodzącej, ale
pomija aktualizację `lastRoute` sesji głównej.

## Chronione rejestrowanie wiadomości przychodzących

Pluginy kanałów mogą oznaczyć rekord sesji przychodzącej jako `createIfMissing: false`,
gdy chroniona ścieżka nie może utworzyć nowej sesji OpenClaw. W tym trybie
OpenClaw może zaktualizować metadane i `lastRoute` istniejącej sesji, ale
nie tworzy wpisu sesji przeznaczonego wyłącznie do routingu tylko dlatego, że zaobserwowano wiadomość.

## Reguły routingu (sposób wyboru agenta)

Routing wybiera **jednego agenta** dla każdej wiadomości przychodzącej:

1. **Dokładne dopasowanie partnera** (`bindings` z `peer.kind` + `peer.id`).
2. **Dopasowanie partnera nadrzędnego** (dziedziczenie wątku).
3. **Dopasowanie partnera za pomocą symbolu wieloznacznego** (`peer.id: "*"` dla rodzaju partnera).
4. **Dopasowanie gildii i ról** (Discord) za pomocą `guildId` + `roles`.
5. **Dopasowanie gildii** (Discord) za pomocą `guildId`.
6. **Dopasowanie zespołu** (Slack) za pomocą `teamId`.
7. **Dopasowanie konta** (`accountId` w kanale).
8. **Dopasowanie kanału** (dowolne konto w tym kanale, `accountId: "*"`).
9. **Agent domyślny** (`agents.list[].default`, w przeciwnym razie pierwszy wpis na liście, z wartością awaryjną `main`).

Gdy powiązanie zawiera wiele pól dopasowania (`peer`, `guildId`, `teamId`, `roles`), **wszystkie podane pola muszą być zgodne**, aby dane powiązanie miało zastosowanie.

Dopasowany agent określa używany obszar roboczy i magazyn sesji.

## Grupy rozgłoszeniowe (uruchamianie wielu agentów)

Grupy rozgłoszeniowe umożliwiają uruchamianie **wielu agentów** dla tego samego partnera **gdy OpenClaw normalnie by odpowiedział** (na przykład: w grupach WhatsApp po przejściu kontroli wzmianki/aktywacji).

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
- `bindings`: mapowanie przychodzących kanałów/kont/partnerów na agentów.

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

Wiersze sesji środowiska wykonawczego znajdują się w bazie danych SQLite każdego agenta w katalogu
stanu (domyślnie `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`

Starsze instalacje mogą zawierać starsze pliki transkrypcji JSONL i magazyn
wierszy `sessions.json` w `~/.openclaw/agents/<agentId>/sessions/`. Uruchomienie Gateway oraz
`openclaw doctor --fix` automatycznie importują aktywne starsze wiersze/historię do SQLite.
Aby uzyskać jawne dowody migracji, należy użyć `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` oraz sekwencji walidacji
[Doctor](/pl/cli/doctor#session-sqlite-migration).
Nadal można wybrać ścieżkę starszego magazynu za pomocą szablonów `session.store` i `{agentId}`
na potrzeby migracji i prac konserwacyjnych w trybie offline.

Mechanizmy wykrywania sesji Gateway i ACP skanują również magazyny agentów zapisane na dysku w
domyślnym katalogu głównym `agents/` oraz w katalogach głównych określonych szablonami `session.store`. Wykryte
magazyny muszą pozostawać wewnątrz rozstrzygniętego katalogu głównego agenta i korzystać ze zwykłego starszego
pliku `sessions.json`. Dowiązania symboliczne i ścieżki poza katalogiem głównym są ignorowane.

## Zachowanie WebChat

WebChat dołącza do **wybranego agenta** i domyślnie używa jego sesji głównej.
Dzięki temu WebChat umożliwia przeglądanie kontekstu tego agenta z różnych kanałów
w jednym miejscu.

## Kontekst odpowiedzi

Odpowiedzi przychodzące zawierają:

- `ReplyToId`, `ReplyToBody` i `ReplyToSender`, gdy są dostępne.
- Cytowany kontekst jest dołączany do `Body` jako blok `[Replying to ...]`.

To zachowanie jest spójne we wszystkich kanałach.

## Powiązane materiały

- [Grupy](/pl/channels/groups)
- [Grupy rozgłoszeniowe](/pl/channels/broadcast-groups)
- [Parowanie](/pl/channels/pairing)
