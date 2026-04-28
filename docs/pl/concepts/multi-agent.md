---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Routing wielu agentów: izolowani agenci, konta kanałów i powiązania'
title: Routing wielu agentów
x-i18n:
    generated_at: "2026-04-26T11:27:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 845149ac1076d4746cc5038bd4444c2fc6117710f724b8cabdc31dc9ef6abbe8
    source_path: concepts/multi-agent.md
    workflow: 15
---

Uruchamiaj wielu _izolowanych_ agentów — każdy z własnym obszarem roboczym, katalogiem stanu (`agentDir`) i historią sesji — oraz wiele kont kanałów (np. dwa WhatsAppy) w ramach jednego działającego Gateway. Wiadomości przychodzące są kierowane do właściwego agenta przez powiązania.

**Agent** w tym kontekście to pełny zakres jednej persony: pliki obszaru roboczego, profile auth, rejestr modeli i magazyn sesji. `agentDir` to katalog stanu na dysku, który przechowuje tę konfigurację per agent w `~/.openclaw/agents/<agentId>/`. **Powiązanie** mapuje konto kanału (np. workspace Slack albo numer WhatsApp) na jednego z tych agentów.

## Co oznacza „jeden agent”?

**Agent** to w pełni wydzielony „mózg” z własnym:

- **Obszarem roboczym** (pliki, AGENTS.md/SOUL.md/USER.md, lokalne notatki, reguły persony).
- **Katalogiem stanu** (`agentDir`) dla profili auth, rejestru modeli i konfiguracji per agent.
- **Magazynem sesji** (historia czatu + stan routingu) w `~/.openclaw/agents/<agentId>/sessions`.

Profile auth są **per agent**. Każdy agent odczytuje je z własnego pliku:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` to także tutaj bezpieczniejsza ścieżka przywoływania między sesjami: zwraca ograniczony, oczyszczony widok, a nie surowy zrzut transkryptu. Przywołanie asystenta usuwa tagi thinking, rusztowanie `<relevant-memories>`, payloady XML wywołań narzędzi w jawnym tekście (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz obcięte bloki wywołań narzędzi), zdegradowane rusztowanie wywołań narzędzi, wyciekłe tokeny sterujące modelem ASCII/full-width oraz błędny XML wywołań narzędzi MiniMax przed redakcją/obcięciem.
</Note>

<Warning>
Poświadczenia głównego agenta **nie** są współdzielone automatycznie. Nigdy nie używaj tego samego `agentDir` dla wielu agentów (powoduje to kolizje auth/sesji). Jeśli chcesz współdzielić poświadczenia, skopiuj `auth-profiles.json` do `agentDir` drugiego agenta.
</Warning>

Skills są ładowane z obszaru roboczego każdego agenta oraz ze współdzielonych katalogów głównych, takich jak `~/.openclaw/skills`, a następnie filtrowane przez efektywną allowlistę Skills agenta, jeśli jest skonfigurowana. Użyj `agents.defaults.skills` dla współdzielonej bazy oraz `agents.list[].skills` dla zastąpienia per agent. Zobacz [Skills: per agent vs współdzielone](/pl/tools/skills#per-agent-vs-shared-skills) oraz [Skills: allowlisty Skills agenta](/pl/tools/skills#agent-skill-allowlists).

Gateway może hostować **jednego agenta** (domyślnie) albo **wielu agentów** obok siebie.

<Note>
**Uwaga o obszarze roboczym:** obszar roboczy każdego agenta to **domyślny cwd**, a nie twardy sandbox. Ścieżki względne są rozwiązywane wewnątrz obszaru roboczego, ale ścieżki bezwzględne mogą sięgać innych lokalizacji hosta, jeśli sandboxing nie jest włączony. Zobacz [Sandboxing](/pl/gateway/sandboxing).
</Note>

## Ścieżki (szybka mapa)

- Konfiguracja: `~/.openclaw/openclaw.json` (lub `OPENCLAW_CONFIG_PATH`)
- Katalog stanu: `~/.openclaw` (lub `OPENCLAW_STATE_DIR`)
- Obszar roboczy: `~/.openclaw/workspace` (lub `~/.openclaw/workspace-<agentId>`)
- Katalog agenta: `~/.openclaw/agents/<agentId>/agent` (lub `agents.list[].agentDir`)
- Sesje: `~/.openclaw/agents/<agentId>/sessions`

### Tryb jednego agenta (domyślny)

Jeśli nic nie zrobisz, OpenClaw uruchamia jednego agenta:

- `agentId` domyślnie ma wartość **`main`**.
- Klucze sesji mają postać `agent:main:<mainKey>`.
- Obszar roboczy domyślnie to `~/.openclaw/workspace` (lub `~/.openclaw/workspace-<profile>`, gdy ustawione jest `OPENCLAW_PROFILE`).
- Stan domyślnie to `~/.openclaw/agents/main/agent`.

## Pomocnik agentów

Użyj kreatora agentów, aby dodać nowego izolowanego agenta:

```bash
openclaw agents add work
```

Następnie dodaj `bindings` (lub pozwól kreatorowi zrobić to za ciebie), aby kierować wiadomości przychodzące.

Zweryfikuj poleceniem:

```bash
openclaw agents list --bindings
```

## Szybki start

<Steps>
  <Step title="Utwórz obszar roboczy każdego agenta">
    Użyj kreatora albo utwórz obszary robocze ręcznie:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Każdy agent otrzymuje własny obszar roboczy z `SOUL.md`, `AGENTS.md` i opcjonalnym `USER.md`, a także dedykowany `agentDir` i magazyn sesji w `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Utwórz konta kanałów">
    Utwórz po jednym koncie na agenta w wybranych kanałach:

    - Discord: jeden bot na agenta, włącz Message Content Intent, skopiuj każdy token.
    - Telegram: jeden bot na agenta przez BotFather, skopiuj każdy token.
    - WhatsApp: sparuj każdy numer telefonu jako osobne konto.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Zobacz przewodniki kanałów: [Discord](/pl/channels/discord), [Telegram](/pl/channels/telegram), [WhatsApp](/pl/channels/whatsapp).

  </Step>
  <Step title="Dodaj agentów, konta i powiązania">
    Dodaj agentów w `agents.list`, konta kanałów w `channels.<channel>.accounts` i połącz je przez `bindings` (przykłady poniżej).
  </Step>
  <Step title="Uruchom ponownie i zweryfikuj">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## Wielu agentów = wiele osób, wiele osobowości

Przy **wielu agentach** każdy `agentId` staje się **w pełni izolowaną personą**:

- **Różne numery telefonów/konta** (per kanał `accountId`).
- **Różne osobowości** (pliki obszaru roboczego per agent, takie jak `AGENTS.md` i `SOUL.md`).
- **Oddzielne auth + sesje** (bez przenikania między nimi, chyba że jawnie to włączysz).

Pozwala to **wielu osobom** współdzielić jeden serwer Gateway, przy jednoczesnym zachowaniu izolacji ich „mózgów” AI i danych.

## Wyszukiwanie pamięci QMD między agentami

Jeśli jeden agent ma przeszukiwać transkrypty sesji QMD innego agenta, dodaj dodatkowe kolekcje w `agents.list[].memorySearch.qmd.extraCollections`. Użyj `agents.defaults.memorySearch.qmd.extraCollections` tylko wtedy, gdy każdy agent ma dziedziczyć te same współdzielone kolekcje transkryptów.

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

Ścieżka dodatkowej kolekcji może być współdzielona między agentami, ale nazwa kolekcji pozostaje jawna, gdy ścieżka znajduje się poza obszarem roboczym agenta. Ścieżki wewnątrz obszaru roboczego pozostają ograniczone do danego agenta, dzięki czemu każdy agent zachowuje własny zestaw wyszukiwania transkryptów.

## Jeden numer WhatsApp, wiele osób (podział DM)

Możesz kierować **różne DM WhatsApp** do różnych agentów, pozostając przy **jednym koncie WhatsApp**. Dopasowuj po E.164 nadawcy (np. `+15551234567`) z `peer.kind: "direct"`. Odpowiedzi nadal wychodzą z tego samego numeru WhatsApp (bez tożsamości nadawcy per agent).

<Note>
Czaty bezpośrednie zwijają się do **głównego klucza sesji** agenta, więc prawdziwa izolacja wymaga **jednego agenta na osobę**.
</Note>

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

- Kontrola dostępu DM jest **globalna per konto WhatsApp** (parowanie/allowlista), a nie per agent.
- Dla współdzielonych grup przypisz grupę do jednego agenta albo użyj [Grup rozgłoszeniowych](/pl/channels/broadcast-groups).

## Reguły routingu (jak wiadomości wybierają agenta)

Powiązania są **deterministyczne** i obowiązuje zasada **najbardziej szczegółowe wygrywa**:

<Steps>
  <Step title="dopasowanie peer">
    Dokładny identyfikator DM/grupy/kanału.
  </Step>
  <Step title="dopasowanie parentPeer">
    Dziedziczenie wątku.
  </Step>
  <Step title="guildId + roles">
    Routing ról Discord.
  </Step>
  <Step title="guildId">
    Discord.
  </Step>
  <Step title="teamId">
    Slack.
  </Step>
  <Step title="dopasowanie accountId dla kanału">
    Fallback per konto.
  </Step>
  <Step title="Dopasowanie na poziomie kanału">
    `accountId: "*"`.
  </Step>
  <Step title="Domyślny agent">
    Fallback do `agents.list[].default`, w przeciwnym razie pierwszy wpis listy, domyślnie: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Rozstrzyganie remisów i semantyka AND">
    - Jeśli wiele powiązań pasuje w tej samej warstwie, wygrywa pierwsze w kolejności konfiguracji.
    - Jeśli powiązanie ustawia wiele pól dopasowania (na przykład `peer` + `guildId`), wszystkie określone pola są wymagane (semantyka `AND`).

  </Accordion>
  <Accordion title="Szczegóły zakresu konta">
    - Powiązanie, które pomija `accountId`, pasuje tylko do konta domyślnego.
    - Użyj `accountId: "*"` dla fallbacku na poziomie kanału obejmującego wszystkie konta.
    - Jeśli później dodasz to samo powiązanie dla tego samego agenta z jawnym identyfikatorem konta, OpenClaw zaktualizuje istniejące powiązanie tylko na poziomie kanału do zakresu konta zamiast je duplikować.

  </Accordion>
</AccordionGroup>

## Wiele kont / numerów telefonów

Kanały obsługujące **wiele kont** (np. WhatsApp) używają `accountId` do identyfikacji każdego logowania. Każdy `accountId` może być kierowany do innego agenta, dzięki czemu jeden serwer może hostować wiele numerów telefonów bez mieszania sesji.

Jeśli chcesz ustawić domyślne konto na poziomie kanału, gdy `accountId` jest pominięte, ustaw `channels.<channel>.defaultAccount` (opcjonalnie). Gdy nie jest ustawione, OpenClaw wraca do `default`, jeśli istnieje, w przeciwnym razie do pierwszego skonfigurowanego `accountId` (sortowanego).

Typowe kanały obsługujące ten wzorzec to:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Pojęcia

- `agentId`: jeden „mózg” (obszar roboczy, auth per agent, magazyn sesji per agent).
- `accountId`: jedna instancja konta kanału (np. konto WhatsApp `"personal"` vs `"biz"`).
- `binding`: kieruje wiadomości przychodzące do `agentId` według `(channel, accountId, peer)` oraz opcjonalnie identyfikatorów guild/team.
- Czaty bezpośrednie zwijają się do `agent:<agentId>:<mainKey>` (per-agentowe „main”; `session.mainKey`).

## Przykłady platform

<AccordionGroup>
  <Accordion title="Boty Discord per agent">
    Każde konto bota Discord mapuje się na unikalny `accountId`. Powiąż każde konto z agentem i utrzymuj allowlisty per bot.

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

    - Zaproś każdego bota do guild i włącz Message Content Intent.
    - Tokeny znajdują się w `channels.discord.accounts.<id>.token` (konto domyślne może używać `DISCORD_BOT_TOKEN`).

  </Accordion>
  <Accordion title="Boty Telegram per agent">
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

    - Utwórz jednego bota na agenta przez BotFather i skopiuj każdy token.
    - Tokeny znajdują się w `channels.telegram.accounts.<id>.botToken` (konto domyślne może używać `TELEGRAM_BOT_TOKEN`).

  </Accordion>
  <Accordion title="Numery WhatsApp per agent">
    Sparuj każde konto przed uruchomieniem Gateway:

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

      // Deterministic routing: first match wins (most-specific first).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Optional per-peer override (example: send a specific group to work agent).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // Off by default: agent-to-agent messaging must be explicitly enabled + allowlisted.
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
              // Optional override. Default: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // Optional override. Default: ~/.openclaw/credentials/whatsapp/biz
              // authDir: "~/.openclaw/credentials/whatsapp/biz",
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Typowe wzorce

<Tabs>
  <Tab title="Codzienny WhatsApp + Telegram do pracy głębokiej">
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
    - Aby kierować pojedynczy DM/grupę do Opus, a resztę zostawić na chat, dodaj powiązanie `match.peer` dla tego peera; dopasowania peer zawsze mają pierwszeństwo przed regułami obejmującymi cały kanał.

  </Tab>
  <Tab title="Ten sam kanał, jeden peer do Opus">
    Pozostaw WhatsApp na szybkim agencie, ale kieruj jeden DM do Opus:

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

    Powiązania peer zawsze mają pierwszeństwo, więc trzymaj je nad regułą dla całego kanału.

  </Tab>
  <Tab title="Agent rodzinny powiązany z grupą WhatsApp">
    Powiąż dedykowanego agenta rodzinnego z jedną grupą WhatsApp, z bramkowaniem przez wzmianki i bardziej restrykcyjną polityką narzędzi:

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

    - Listy allow/deny narzędzi dotyczą **narzędzi**, a nie Skills. Jeśli Skill ma uruchamiać plik binarny, upewnij się, że `exec` jest dozwolone i że plik binarny istnieje w sandboxie.
    - Aby uzyskać bardziej restrykcyjne bramkowanie, ustaw `agents.list[].groupChat.mentionPatterns` i pozostaw włączone allowlisty grup dla kanału.

  </Tab>
</Tabs>

## Konfiguracja sandboxa i narzędzi per agent

Każdy agent może mieć własny sandbox i własne ograniczenia narzędzi:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // No sandbox for personal agent
        },
        // No tool restrictions - all tools available
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Always sandboxed
          scope: "agent",  // One container per agent
          docker: {
            // Optional one-time setup after container creation
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Only read tool
          deny: ["exec", "write", "edit", "apply_patch"],    // Deny others
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` znajduje się w `sandbox.docker` i jest uruchamiane raz przy tworzeniu kontenera. Nadpisania per agent `sandbox.docker.*` są ignorowane, gdy rozstrzygnięty zakres ma wartość `"shared"`.
</Note>

**Korzyści:**

- **Izolacja bezpieczeństwa**: ograniczaj narzędzia dla niezaufanych agentów.
- **Kontrola zasobów**: sandboxuj określonych agentów, pozostawiając innych na hoście.
- **Elastyczne polityki**: różne uprawnienia dla różnych agentów.

<Note>
`tools.elevated` jest **globalne** i zależne od nadawcy; nie można go konfigurować per agent. Jeśli potrzebujesz granic per agent, użyj `agents.list[].tools`, aby zablokować `exec`. Dla targetowania grup użyj `agents.list[].groupChat.mentionPatterns`, aby wzmianki @ były jednoznacznie mapowane do właściwego agenta.
</Note>

Zobacz [Sandbox i narzędzia wielu agentów](/pl/tools/multi-agent-sandbox-tools), aby poznać szczegółowe przykłady.

## Powiązane

- [Agenci ACP](/pl/tools/acp-agents) — uruchamianie zewnętrznych harnessów coding
- [Routing kanałów](/pl/channels/channel-routing) — jak wiadomości są kierowane do agentów
- [Obecność](/pl/concepts/presence) — obecność i dostępność agenta
- [Sesja](/pl/concepts/session) — izolacja i routing sesji
- [Subagenci](/pl/tools/subagents) — uruchamianie agentów w tle
