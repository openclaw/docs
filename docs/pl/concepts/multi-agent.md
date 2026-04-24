---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
status: active
summary: 'Routing wielu agentów: izolowani agenci, konta kanałów i bindings'
title: Routing wielu agentów
x-i18n:
    generated_at: "2026-04-24T09:06:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef6f91c53a14bf92427f08243930e4aab50ac7853c9b22b0dbdbb853ea1a93d2
    source_path: concepts/multi-agent.md
    workflow: 15
---

Uruchamiaj wielu _izolowanych_ agentów — każdy z własnym obszarem roboczym, katalogiem stanu (`agentDir`) i historią sesji — plus wiele kont kanałów (np. dwa WhatsAppy) w jednym działającym Gateway. Wiadomości przychodzące są kierowane do właściwego agenta przez bindings.

**Agent** w tym kontekście to pełny zakres per persona: pliki obszaru roboczego, profile uwierzytelniania, rejestr modeli i magazyn sesji. `agentDir` to katalog stanu na dysku, który przechowuje tę konfigurację per agent w `~/.openclaw/agents/<agentId>/`. **Binding** mapuje konto kanału (np. workspace Slack albo numer WhatsApp) na jednego z tych agentów.

## Czym jest „jeden agent”?

**Agent** to w pełni wydzielony „mózg” z własnym:

- **Obszarem roboczym** (pliki, AGENTS.md/SOUL.md/USER.md, lokalne notatki, reguły persony).
- **Katalogiem stanu** (`agentDir`) dla profili uwierzytelniania, rejestru modeli i konfiguracji per agent.
- **Magazynem sesji** (historia czatu + stan routingu) w `~/.openclaw/agents/<agentId>/sessions`.

Profile uwierzytelniania są **per agent**. Każdy agent odczytuje ze swojego:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

`sessions_history` jest tutaj również bezpieczniejszą ścieżką recall między sesjami: zwraca
ograniczony, oczyszczony widok, a nie surowy zrzut transkrypcji. Recall asystenta usuwa
tagi myślenia, scaffolding `<relevant-memories>`, ładunki XML wywołań narzędzi w postaci zwykłego tekstu
(w tym `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` oraz ucięte bloki wywołań narzędzi),
zdegradowany scaffolding wywołań narzędzi, wyciekłe tokeny sterujące modelu ASCII/full-width
oraz nieprawidłowy XML wywołań narzędzi MiniMax przed redakcją/ucięciem.

Poświadczenia głównego agenta **nie** są współdzielone automatycznie. Nigdy nie używaj ponownie `agentDir`
między agentami (powoduje to kolizje auth/sesji). Jeśli chcesz współdzielić poświadczenia,
skopiuj `auth-profiles.json` do `agentDir` drugiego agenta.

Skills są ładowane z obszaru roboczego każdego agenta oraz współdzielonych katalogów głównych, takich jak
`~/.openclaw/skills`, a następnie filtrowane przez efektywną listę dozwolonych skill agenta, gdy
jest skonfigurowana. Użyj `agents.defaults.skills` dla współdzielonej bazy oraz
`agents.list[].skills` dla zastąpienia per agent. Zobacz
[Skills: per-agent vs shared](/pl/tools/skills#per-agent-vs-shared-skills) oraz
[Skills: agent skill allowlists](/pl/tools/skills#agent-skill-allowlists).

Gateway może hostować **jednego agenta** (domyślnie) albo **wielu agentów** obok siebie.

**Uwaga o obszarze roboczym:** obszar roboczy każdego agenta jest domyślnym `cwd`, a nie twardym
sandboxem. Ścieżki względne rozwiązują się wewnątrz obszaru roboczego, ale ścieżki bezwzględne mogą
sięgać do innych lokalizacji hosta, chyba że włączono sandboxing. Zobacz
[Sandboxing](/pl/gateway/sandboxing).

## Ścieżki (szybka mapa)

- Konfiguracja: `~/.openclaw/openclaw.json` (lub `OPENCLAW_CONFIG_PATH`)
- Katalog stanu: `~/.openclaw` (lub `OPENCLAW_STATE_DIR`)
- Obszar roboczy: `~/.openclaw/workspace` (lub `~/.openclaw/workspace-<agentId>`)
- Katalog agenta: `~/.openclaw/agents/<agentId>/agent` (lub `agents.list[].agentDir`)
- Sesje: `~/.openclaw/agents/<agentId>/sessions`

### Tryb jednego agenta (domyślny)

Jeśli nic nie zrobisz, OpenClaw uruchomi jednego agenta:

- `agentId` domyślnie ma wartość **`main`**.
- Sesje są kluczowane jako `agent:main:<mainKey>`.
- Obszar roboczy domyślnie to `~/.openclaw/workspace` (lub `~/.openclaw/workspace-<profile>`, gdy ustawiono `OPENCLAW_PROFILE`).
- Stan domyślnie to `~/.openclaw/agents/main/agent`.

## Pomocnik agentów

Użyj kreatora agentów, aby dodać nowego izolowanego agenta:

```bash
openclaw agents add work
```

Następnie dodaj `bindings` (albo pozwól kreatorowi to zrobić), aby kierować wiadomości przychodzące.

Zweryfikuj przez:

```bash
openclaw agents list --bindings
```

## Szybki start

<Steps>
  <Step title="Create each agent workspace">

Użyj kreatora albo utwórz obszary robocze ręcznie:

```bash
openclaw agents add coding
openclaw agents add social
```

Każdy agent otrzymuje własny obszar roboczy z `SOUL.md`, `AGENTS.md` i opcjonalnym `USER.md`, a także dedykowany `agentDir` i magazyn sesji w `~/.openclaw/agents/<agentId>`.

  </Step>

  <Step title="Create channel accounts">

Utwórz jedno konto na agenta w preferowanych kanałach:

- Discord: jeden bot na agenta, włącz Message Content Intent, skopiuj każdy token.
- Telegram: jeden bot na agenta przez BotFather, skopiuj każdy token.
- WhatsApp: powiąż każdy numer telefonu z kontem.

```bash
openclaw channels login --channel whatsapp --account work
```

Zobacz przewodniki po kanałach: [Discord](/pl/channels/discord), [Telegram](/pl/channels/telegram), [WhatsApp](/pl/channels/whatsapp).

  </Step>

  <Step title="Add agents, accounts, and bindings">

Dodaj agentów w `agents.list`, konta kanałów w `channels.<channel>.accounts` i połącz je za pomocą `bindings` (przykłady poniżej).

  </Step>

  <Step title="Restart and verify">

```bash
openclaw gateway restart
openclaw agents list --bindings
openclaw channels status --probe
```

  </Step>
</Steps>

## Wielu agentów = wielu ludzi, wiele osobowości

Przy **wielu agentach** każdy `agentId` staje się **w pełni izolowaną personą**:

- **Różne numery telefonów/konta** (per kanał `accountId`).
- **Różne osobowości** (pliki obszaru roboczego per agent, takie jak `AGENTS.md` i `SOUL.md`).
- **Oddzielne auth + sesje** (bez przenikania, chyba że zostanie to jawnie włączone).

To pozwala **wielu osobom** współdzielić jeden serwer Gateway przy zachowaniu izolacji ich „mózgów” AI i danych.

## Międzyagentowe wyszukiwanie pamięci QMD

Jeśli jeden agent ma przeszukiwać transkrypcje sesji QMD innego agenta, dodaj
dodatkowe kolekcje w `agents.list[].memorySearch.qmd.extraCollections`.
Używaj `agents.defaults.memorySearch.qmd.extraCollections` tylko wtedy, gdy każdy agent
ma dziedziczyć ten sam współdzielony zestaw kolekcji transkrypcji.

```json5
{
  agents: {
    defaults: {
      workspace: "~/workspaces/main",
      memorySearch: {
        qmd: {
          extraCollections: [{ path: "~/agents/family/sessions", name: "family-sessions" }],
        },
      },
    },
    list: [
      {
        id: "main",
        workspace: "~/workspaces/main",
        memorySearch: {
          qmd: {
            extraCollections: [{ path: "notes" }], // resolves inside workspace -> collection named "notes-main"
          },
        },
      },
      { id: "family", workspace: "~/workspaces/family" },
    ],
  },
  memory: {
    backend: "qmd",
    qmd: { includeDefaultMemory: false },
  },
}
```

Ścieżka dodatkowej kolekcji może być współdzielona przez agentów, ale nazwa kolekcji
pozostaje jawna, gdy ścieżka znajduje się poza obszarem roboczym agenta. Ścieżki wewnątrz
obszaru roboczego pozostają ograniczone do agenta, dzięki czemu każdy agent zachowuje własny zestaw wyszukiwania transkrypcji.

## Jeden numer WhatsApp, wiele osób (podział DM)

Możesz kierować **różne DM WhatsApp** do różnych agentów, pozostając przy **jednym koncie WhatsApp**. Dopasowuj po E.164 nadawcy (np. `+15551234567`) z `peer.kind: "direct"`. Odpowiedzi nadal będą pochodzić z tego samego numeru WhatsApp (bez tożsamości nadawcy per agent).

Ważny szczegół: czaty bezpośrednie zwijają się do **głównego klucza sesji** agenta, więc prawdziwa izolacja wymaga **jednego agenta na osobę**.

Przykład:

```json5
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.openclaw/workspace-alex" },
      { id: "mia", workspace: "~/.openclaw/workspace-mia" },
    ],
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230001" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230002" } },
    },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"],
    },
  },
}
```

Uwagi:

- Kontrola dostępu DM jest **globalna dla konta WhatsApp** (pairing/allowlist), a nie per agent.
- Dla współdzielonych grup przypisz grupę do jednego agenta albo użyj [Broadcast groups](/pl/channels/broadcast-groups).

## Zasady routingu (jak wiadomości wybierają agenta)

Bindings są **deterministyczne** i obowiązuje zasada **najbardziej szczegółowe wygrywa**:

1. dopasowanie `peer` (dokładny identyfikator DM/grupy/kanału)
2. dopasowanie `parentPeer` (dziedziczenie wątku)
3. `guildId + roles` (routing według ról Discord)
4. `guildId` (Discord)
5. `teamId` (Slack)
6. dopasowanie `accountId` dla kanału
7. dopasowanie na poziomie kanału (`accountId: "*"`)
8. fallback do agenta domyślnego (`agents.list[].default`, w przeciwnym razie pierwszy wpis listy, domyślnie: `main`)

Jeśli wiele bindings pasuje w tej samej warstwie, wygrywa pierwszy w kolejności konfiguracji.
Jeśli binding ustawia wiele pól dopasowania (na przykład `peer` + `guildId`), wszystkie określone pola są wymagane (semantyka `AND`).

Ważny szczegół dotyczący zakresu konta:

- Binding, który pomija `accountId`, pasuje tylko do konta domyślnego.
- Użyj `accountId: "*"` dla fallbacku obejmującego cały kanał na wszystkich kontach.
- Jeśli później dodasz ten sam binding dla tego samego agenta z jawnym identyfikatorem konta, OpenClaw podniesie istniejący binding tylko kanałowy do zakresu konta zamiast go duplikować.

## Wiele kont / numerów telefonów

Kanały obsługujące **wiele kont** (np. WhatsApp) używają `accountId` do identyfikacji
każdego logowania. Każdy `accountId` może być routowany do innego agenta, więc jeden serwer może hostować
wiele numerów telefonów bez mieszania sesji.

Jeśli chcesz ustawić domyślne konto dla całego kanału, gdy `accountId` jest pominięte, ustaw
opcjonalne `channels.<channel>.defaultAccount`. Gdy nie jest ustawione, OpenClaw przechodzi
na `default`, jeśli istnieje, a w przeciwnym razie na pierwszy skonfigurowany identyfikator konta (sortowany).

Typowe kanały obsługujące ten wzorzec obejmują:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Pojęcia

- `agentId`: jeden „mózg” (obszar roboczy, auth per agent, magazyn sesji per agent).
- `accountId`: jedna instancja konta kanału (np. konto WhatsApp `"personal"` vs `"biz"`).
- `binding`: kieruje wiadomości przychodzące do `agentId` według `(channel, accountId, peer)` oraz opcjonalnie identyfikatorów guild/team.
- Czaty bezpośrednie zwijają się do `agent:<agentId>:<mainKey>` (główna sesja per agent; `session.mainKey`).

## Przykłady platform

### Boty Discord per agent

Każde konto bota Discord mapuje się na unikalny `accountId`. Powiąż każde konto z agentem i utrzymuj listy dozwolonych per bot.

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "coding", workspace: "~/.openclaw/workspace-coding" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "discord", accountId: "default" } },
    { agentId: "coding", match: { channel: "discord", accountId: "coding" } },
  ],
  channels: {
    discord: {
      groupPolicy: "allowlist",
      accounts: {
        default: {
          token: "DISCORD_BOT_TOKEN_MAIN",
          guilds: {
            "123456789012345678": {
              channels: {
                "222222222222222222": { allow: true, requireMention: false },
              },
            },
          },
        },
        coding: {
          token: "DISCORD_BOT_TOKEN_CODING",
          guilds: {
            "123456789012345678": {
              channels: {
                "333333333333333333": { allow: true, requireMention: false },
              },
            },
          },
        },
      },
    },
  },
}
```

Uwagi:

- Zaproś każdego bota do guild i włącz Message Content Intent.
- Tokeny znajdują się w `channels.discord.accounts.<id>.token` (konto domyślne może używać `DISCORD_BOT_TOKEN`).

### Boty Telegram per agent

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "alerts", workspace: "~/.openclaw/workspace-alerts" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "telegram", accountId: "default" } },
    { agentId: "alerts", match: { channel: "telegram", accountId: "alerts" } },
  ],
  channels: {
    telegram: {
      accounts: {
        default: {
          botToken: "123456:ABC...",
          dmPolicy: "pairing",
        },
        alerts: {
          botToken: "987654:XYZ...",
          dmPolicy: "allowlist",
          allowFrom: ["tg:123456789"],
        },
      },
    },
  },
}
```

Uwagi:

- Utwórz jednego bota na agenta przez BotFather i skopiuj każdy token.
- Tokeny znajdują się w `channels.telegram.accounts.<id>.botToken` (konto domyślne może używać `TELEGRAM_BOT_TOKEN`).

### Numery WhatsApp per agent

Powiąż każde konto przed uruchomieniem gateway:

```bash
openclaw channels login --channel whatsapp --account personal
openclaw channels login --channel whatsapp --account biz
```

`~/.openclaw/openclaw.json` (JSON5):

```js
{
  agents: {
    list: [
      {
        id: "home",
        default: true,
        name: "Home",
        workspace: "~/.openclaw/workspace-home",
        agentDir: "~/.openclaw/agents/home/agent",
      },
      {
        id: "work",
        name: "Work",
        workspace: "~/.openclaw/workspace-work",
        agentDir: "~/.openclaw/agents/work/agent",
      },
    ],
  },

  // Deterministyczny routing: pierwsze dopasowanie wygrywa (najbardziej szczegółowe na początku).
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // Opcjonalne nadpisanie per peer (przykład: wyślij konkretną grupę do agenta work).
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // Domyślnie wyłączone: komunikacja agent-do-agenta musi być jawnie włączona + dodana do listy dozwolonych.
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },

  channels: {
    whatsapp: {
      accounts: {
        personal: {
          // Opcjonalne nadpisanie. Domyślnie: ~/.openclaw/credentials/whatsapp/personal
          // authDir: "~/.openclaw/credentials/whatsapp/personal",
        },
        biz: {
          // Opcjonalne nadpisanie. Domyślnie: ~/.openclaw/credentials/whatsapp/biz
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

## Przykład: codzienny czat na WhatsApp + głęboka praca na Telegram

Podział według kanału: kieruj WhatsApp do szybkiego agenta do codziennych spraw, a Telegram do agenta Opus.

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    { agentId: "chat", match: { channel: "whatsapp" } },
    { agentId: "opus", match: { channel: "telegram" } },
  ],
}
```

Uwagi:

- Jeśli masz wiele kont dla kanału, dodaj `accountId` do bindingu (na przykład `{ channel: "whatsapp", accountId: "personal" }`).
- Aby skierować pojedyncze DM/grupę do Opus, zachowując resztę na agencie chat, dodaj binding `match.peer` dla tego peera; dopasowania peera zawsze wygrywają z regułami obejmującymi cały kanał.

## Przykład: ten sam kanał, jeden peer do Opus

Pozostaw WhatsApp na szybkim agencie, ale kieruj jedno DM do Opus:

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    {
      agentId: "opus",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551234567" } },
    },
    { agentId: "chat", match: { channel: "whatsapp" } },
  ],
}
```

Bindings peera zawsze wygrywają, więc umieszczaj je nad regułą obejmującą cały kanał.

## Agent rodzinny powiązany z grupą WhatsApp

Powiąż dedykowanego agenta rodzinnego z jedną grupą WhatsApp, z bramkowaniem
wzmianek i bardziej restrykcyjną polityką narzędzi:

```json5
{
  agents: {
    list: [
      {
        id: "family",
        name: "Family",
        workspace: "~/.openclaw/workspace-family",
        identity: { name: "Family Bot" },
        groupChat: {
          mentionPatterns: ["@family", "@familybot", "@Family Bot"],
        },
        sandbox: {
          mode: "all",
          scope: "agent",
        },
        tools: {
          allow: [
            "exec",
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"],
        },
      },
    ],
  },
  bindings: [
    {
      agentId: "family",
      match: {
        channel: "whatsapp",
        peer: { kind: "group", id: "120363999999999999@g.us" },
      },
    },
  ],
}
```

Uwagi:

- Listy allow/deny narzędzi dotyczą **narzędzi**, a nie skill. Jeśli skill musi uruchomić
  plik binarny, upewnij się, że `exec` jest dozwolone, a plik binarny istnieje w sandboxie.
- Dla bardziej restrykcyjnego bramkowania ustaw `agents.list[].groupChat.mentionPatterns` i pozostaw
  włączone listy dozwolonych grup dla kanału.

## Konfiguracja Sandbox i narzędzi per agent

Każdy agent może mieć własny sandbox i własne ograniczenia narzędzi:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // Brak sandboxa dla agenta personal
        },
        // Brak ograniczeń narzędzi - wszystkie narzędzia dostępne
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Zawsze w sandboxie
          scope: "agent",  // Jeden kontener na agenta
          docker: {
            // Opcjonalna jednorazowa konfiguracja po utworzeniu kontenera
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Tylko narzędzie read
          deny: ["exec", "write", "edit", "apply_patch"],    // Odmów innych
        },
      },
    ],
  },
}
```

Uwaga: `setupCommand` znajduje się pod `sandbox.docker` i uruchamia się raz przy tworzeniu kontenera.
Nadpisania per agent `sandbox.docker.*` są ignorowane, gdy rozwiązany zakres to `"shared"`.

**Korzyści:**

- **Izolacja bezpieczeństwa**: ogranicz narzędzia dla niezaufanych agentów
- **Kontrola zasobów**: umieszczaj wybranych agentów w sandboxie, pozostawiając innych na hoście
- **Elastyczne polityki**: różne uprawnienia dla różnych agentów

Uwaga: `tools.elevated` jest **globalne** i oparte na nadawcy; nie można go konfigurować per agent.
Jeśli potrzebujesz granic per agent, użyj `agents.list[].tools`, aby odmówić `exec`.
Do targetowania grup użyj `agents.list[].groupChat.mentionPatterns`, aby @wzmianki czysto mapowały się na zamierzonego agenta.

Zobacz [Multi-Agent Sandbox & Tools](/pl/tools/multi-agent-sandbox-tools), aby poznać szczegółowe przykłady.

## Powiązane

- [Channel Routing](/pl/channels/channel-routing) — jak wiadomości są kierowane do agentów
- [Sub-Agents](/pl/tools/subagents) — uruchamianie agentów w tle
- [ACP Agents](/pl/tools/acp-agents) — uruchamianie zewnętrznych harnessów kodowania
- [Presence](/pl/concepts/presence) — obecność i dostępność agentów
- [Session](/pl/concepts/session) — izolacja sesji i routing
