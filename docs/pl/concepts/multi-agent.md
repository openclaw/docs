---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
status: active
summary: 'Routing wielu agentów: izolowani agenci, konta kanałów i powiązania'
title: Routing wielu agentów
x-i18n:
    generated_at: "2026-04-05T13:51:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e8bc48f229d01aa793ca4137e5a59f2a5ceb0ba65841710aaf69f53a672be60
    source_path: concepts/multi-agent.md
    workflow: 15
---

# Routing wielu agentów

Cel: wiele _izolowanych_ agentów (oddzielny workspace + `agentDir` + sesje), a także wiele kont kanałów (np. dwa konta WhatsApp) w jednym uruchomionym Gateway. Ruch przychodzący jest kierowany do agenta przez powiązania.

## Co oznacza „jeden agent”?

**Agent** to w pełni wydzielony „mózg” z własnymi:

- **Workspace** (pliki, AGENTS.md/SOUL.md/USER.md, lokalne notatki, reguły persony).
- **Katalogiem stanu** (`agentDir`) dla profili uwierzytelniania, rejestru modeli i config per agent.
- **Magazynem sesji** (historia czatu + stan routingu) w `~/.openclaw/agents/<agentId>/sessions`.

Profile uwierzytelniania są **per agent**. Każdy agent odczytuje je z własnego pliku:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

Także tutaj `sessions_history` jest bezpieczniejszą ścieżką przywoływania między sesjami: zwraca
ograniczony, oczyszczony widok, a nie surowy zrzut transkryptu. Przywoływanie wypowiedzi asystenta usuwa
tagi myślenia, rusztowanie `<relevant-memories>`, ładunki XML wywołań narzędzi w postaci zwykłego tekstu
(w tym `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` oraz obcięte bloki wywołań narzędzi),
obniżone do zwykłego tekstu rusztowanie wywołań narzędzi, wyciekłe tokeny sterujące modelu w ASCII/pełnej szerokości
oraz nieprawidłowy XML wywołań narzędzi MiniMax przed redakcją/obcięciem.

Poświadczenia głównego agenta **nie** są automatycznie współdzielone. Nigdy nie używaj ponownie `agentDir`
między agentami (powoduje to kolizje uwierzytelniania/sesji). Jeśli chcesz współdzielić poświadczenia,
skopiuj `auth-profiles.json` do `agentDir` drugiego agenta.

Skills są ładowane z workspace każdego agenta oraz ze współdzielonych katalogów głównych, takich jak
`~/.openclaw/skills`, a następnie filtrowane przez efektywną listę dozwolonych Skills agenta, jeśli jest skonfigurowana.
Użyj `agents.defaults.skills` dla współdzielonej bazy oraz
`agents.list[].skills` do zastąpienia per agent. Zobacz
[Skills: per-agent vs shared](/tools/skills#per-agent-vs-shared-skills) oraz
[Skills: agent skill allowlists](/tools/skills#agent-skill-allowlists).

Gateway może hostować **jednego agenta** (domyślnie) albo **wielu agentów** obok siebie.

**Uwaga dotycząca workspace:** workspace każdego agenta jest **domyślnym cwd**, a nie twardą
piaskownicą. Ścieżki względne są rozwiązywane wewnątrz workspace, ale ścieżki bezwzględne mogą
sięgać do innych lokalizacji hosta, chyba że piaskownica jest włączona. Zobacz
[Sandboxing](/gateway/sandboxing).

## Ścieżki (szybka mapa)

- Config: `~/.openclaw/openclaw.json` (lub `OPENCLAW_CONFIG_PATH`)
- Katalog stanu: `~/.openclaw` (lub `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (lub `~/.openclaw/workspace-<agentId>`)
- Agent dir: `~/.openclaw/agents/<agentId>/agent` (lub `agents.list[].agentDir`)
- Sesje: `~/.openclaw/agents/<agentId>/sessions`

### Tryb jednego agenta (domyślny)

Jeśli nic nie zrobisz, OpenClaw uruchomi jednego agenta:

- `agentId` domyślnie ma wartość **`main`**.
- Klucze sesji mają postać `agent:main:<mainKey>`.
- Workspace domyślnie to `~/.openclaw/workspace` (lub `~/.openclaw/workspace-<profile>`, gdy ustawiono `OPENCLAW_PROFILE`).
- Stan domyślnie to `~/.openclaw/agents/main/agent`.

## Pomocnik agentów

Użyj kreatora agentów, aby dodać nowego izolowanego agenta:

```bash
openclaw agents add work
```

Następnie dodaj `bindings` (albo pozwól zrobić to kreatorowi), aby kierować wiadomości przychodzące.

Zweryfikuj za pomocą:

```bash
openclaw agents list --bindings
```

## Szybki start

<Steps>
  <Step title="Create each agent workspace">

Użyj kreatora albo utwórz workspace ręcznie:

```bash
openclaw agents add coding
openclaw agents add social
```

Każdy agent otrzymuje własny workspace z `SOUL.md`, `AGENTS.md` i opcjonalnym `USER.md`, a także dedykowany `agentDir` i magazyn sesji w `~/.openclaw/agents/<agentId>`.

  </Step>

  <Step title="Create channel accounts">

Utwórz jedno konto na agenta w preferowanych kanałach:

- Discord: jeden bot na agenta, włącz Message Content Intent, skopiuj każdy token.
- Telegram: jeden bot na agenta przez BotFather, skopiuj każdy token.
- WhatsApp: podłącz każdy numer telefonu per konto.

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

## Wielu agentów = wiele osób, wiele osobowości

W przypadku **wielu agentów** każdy `agentId` staje się **w pełni izolowaną personą**:

- **Różne numery telefonów/konta** (per `accountId` kanału).
- **Różne osobowości** (pliki workspace per agent, takie jak `AGENTS.md` i `SOUL.md`).
- **Oddzielne uwierzytelnianie + sesje** (brak przenikania, chyba że jawnie je włączysz).

Pozwala to **wielu osobom** współdzielić jeden serwer Gateway, przy jednoczesnym zachowaniu izolacji ich „mózgów” AI i danych.

## Przeszukiwanie pamięci QMD między agentami

Jeśli jeden agent ma przeszukiwać transkrypty sesji QMD innego agenta, dodaj
dodatkowe kolekcje w `agents.list[].memorySearch.qmd.extraCollections`.
Używaj `agents.defaults.memorySearch.qmd.extraCollections` tylko wtedy, gdy każdy agent
ma dziedziczyć te same współdzielone kolekcje transkryptów.

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
            extraCollections: [{ path: "notes" }], // rozwiązywane wewnątrz workspace -> kolekcja o nazwie "notes-main"
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

Ścieżka dodatkowej kolekcji może być współdzielona między agentami, ale nazwa kolekcji
pozostaje jawna, gdy ścieżka znajduje się poza workspace agenta. Ścieżki wewnątrz
workspace pozostają przypisane do agenta, więc każdy agent zachowuje własny zestaw do przeszukiwania transkryptów.

## Jeden numer WhatsApp, wiele osób (podział DM)

Możesz kierować **różne DM na WhatsAppie** do różnych agentów, pozostając przy **jednym koncie WhatsApp**. Dopasowuj po E.164 nadawcy (np. `+15551234567`) przy użyciu `peer.kind: "direct"`. Odpowiedzi nadal będą wychodzić z tego samego numeru WhatsApp (bez tożsamości nadawcy per agent).

Ważny szczegół: czaty bezpośrednie zapadają się do **głównego klucza sesji** agenta, więc prawdziwa izolacja wymaga **jednego agenta na osobę**.

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

- Kontrola dostępu do DM jest **globalna per konto WhatsApp** (parowanie/lista dozwolonych), a nie per agent.
- Dla współdzielonych grup przypisz grupę do jednego agenta albo użyj [Broadcast groups](/pl/channels/broadcast-groups).

## Reguły routingu (jak wiadomości wybierają agenta)

Powiązania są **deterministyczne** i obowiązuje zasada **najbardziej szczegółowe wygrywa**:

1. dopasowanie `peer` (dokładny identyfikator DM/grupy/kanału)
2. dopasowanie `parentPeer` (dziedziczenie wątku)
3. `guildId + roles` (routing po rolach Discord)
4. `guildId` (Discord)
5. `teamId` (Slack)
6. dopasowanie `accountId` dla kanału
7. dopasowanie na poziomie kanału (`accountId: "*"`)
8. fallback do domyślnego agenta (`agents.list[].default`, w przeciwnym razie pierwszy wpis na liście, domyślnie: `main`)

Jeśli wiele powiązań pasuje na tym samym poziomie, wygrywa pierwsze według kolejności w config.
Jeśli powiązanie ustawia wiele pól dopasowania (na przykład `peer` + `guildId`), wszystkie określone pola są wymagane (semantyka `AND`).

Ważny szczegół dotyczący zakresu konta:

- Powiązanie, które pomija `accountId`, pasuje tylko do konta domyślnego.
- Użyj `accountId: "*"` dla fallbacku na poziomie kanału obejmującego wszystkie konta.
- Jeśli później dodasz to samo powiązanie dla tego samego agenta z jawnym identyfikatorem konta, OpenClaw przekształci istniejące powiązanie tylko na poziomie kanału w powiązanie o zakresie konta zamiast je duplikować.

## Wiele kont / numerów telefonów

Kanały obsługujące **wiele kont** (np. WhatsApp) używają `accountId` do identyfikacji
każdego logowania. Każdy `accountId` może być kierowany do innego agenta, dzięki czemu jeden serwer może hostować
wiele numerów telefonów bez mieszania sesji.

Jeśli chcesz mieć domyślne konto na poziomie kanału, gdy `accountId` jest pominięte, ustaw
`channels.<channel>.defaultAccount` (opcjonalnie). Gdy nie jest ustawione, OpenClaw wraca
do `default`, jeśli istnieje, w przeciwnym razie do pierwszego skonfigurowanego `accountId` (posortowanego).

Typowe kanały obsługujące ten wzorzec to:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Pojęcia

- `agentId`: jeden „mózg” (workspace, uwierzytelnianie per agent, magazyn sesji per agent).
- `accountId`: jedna instancja konta kanału (np. konto WhatsApp `"personal"` vs `"biz"`).
- `binding`: kieruje wiadomości przychodzące do `agentId` według `(channel, accountId, peer)` oraz opcjonalnie identyfikatorów guild/team.
- Czaty bezpośrednie zapadają się do `agent:<agentId>:<mainKey>` (główna sesja per agent; `session.mainKey`).

## Przykłady platform

### Boty Discord per agent

Każde konto bota Discord jest mapowane do unikalnego `accountId`. Przypisz każde konto do agenta i utrzymuj listy dozwolonych per bot.

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

Podłącz każde konto przed uruchomieniem gateway:

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

  // Deterministyczny routing: wygrywa pierwsze dopasowanie (najbardziej szczegółowe najpierw).
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

  // Domyślnie wyłączone: wiadomości agent-do-agenta muszą być jawnie włączone + dodane do listy dozwolonych.
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

## Przykład: codzienny czat na WhatsApp + głęboka praca na Telegramie

Podział według kanału: kieruj WhatsApp do szybkiego agenta codziennego, a Telegram do agenta Opus.

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

- Jeśli masz wiele kont dla kanału, dodaj `accountId` do powiązania (na przykład `{ channel: "whatsapp", accountId: "personal" }`).
- Aby skierować pojedynczy DM/grupę do Opus, pozostawiając resztę na agencie chat, dodaj powiązanie `match.peer` dla tego peera; dopasowania peer zawsze wygrywają z regułami dla całego kanału.

## Przykład: ten sam kanał, jeden peer do Opus

Zachowaj WhatsApp na szybkim agencie, ale kieruj jeden DM do Opus:

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

Powiązania peer zawsze wygrywają, więc trzymaj je nad regułą dla całego kanału.

## Agent rodzinny przypisany do grupy WhatsApp

Przypisz dedykowanego agenta rodzinnego do jednej grupy WhatsApp, z bramkowaniem po wzmiankach
i bardziej restrykcyjną polityką narzędzi:

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

- Listy allow/deny narzędzi dotyczą **narzędzi**, a nie Skills. Jeśli Skill musi uruchomić plik binarny, upewnij się, że `exec` jest dozwolone i plik binarny istnieje w piaskownicy.
- Dla bardziej rygorystycznego bramkowania ustaw `agents.list[].groupChat.mentionPatterns` i pozostaw włączone listy dozwolonych grup dla kanału.

## Piaskownica i konfiguracja narzędzi per agent

Każdy agent może mieć własną piaskownicę i własne ograniczenia narzędzi:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // Brak piaskownicy dla osobistego agenta
        },
        // Brak ograniczeń narzędzi - wszystkie narzędzia dostępne
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Zawsze w piaskownicy
          scope: "agent",  // Jeden kontener na agenta
          docker: {
            // Opcjonalna jednorazowa konfiguracja po utworzeniu kontenera
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Tylko narzędzie read
          deny: ["exec", "write", "edit", "apply_patch"],    // Odrzuć pozostałe
        },
      },
    ],
  },
}
```

Uwaga: `setupCommand` znajduje się w `sandbox.docker` i jest uruchamiane raz przy tworzeniu kontenera.
Nadpisania `sandbox.docker.*` per agent są ignorowane, gdy rozpoznany zakres to `"shared"`.

**Korzyści:**

- **Izolacja bezpieczeństwa**: ograniczanie narzędzi dla niezaufanych agentów
- **Kontrola zasobów**: piaskownica dla wybranych agentów przy pozostawieniu innych na hoście
- **Elastyczne polityki**: różne uprawnienia per agent

Uwaga: `tools.elevated` jest **globalne** i oparte na nadawcy; nie można go konfigurować per agent.
Jeśli potrzebujesz granic per agent, użyj `agents.list[].tools`, aby zabronić `exec`.
Do kierowania w grupach użyj `agents.list[].groupChat.mentionPatterns`, aby wzmianki @ były jednoznacznie mapowane do zamierzonego agenta.

Zobacz [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools), aby poznać szczegółowe przykłady.

## Powiązane

- [Channel Routing](/pl/channels/channel-routing) — jak wiadomości są kierowane do agentów
- [Sub-Agents](/tools/subagents) — uruchamianie agentów w tle
- [ACP Agents](/tools/acp-agents) — uruchamianie zewnętrznych harnessów kodowania
- [Presence](/concepts/presence) — obecność i dostępność agentów
- [Session](/concepts/session) — izolacja sesji i routing
