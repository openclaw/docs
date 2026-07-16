---
read_when: You want multiple agents with separate workspaces, auth, and sessions in one Gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Routing wieloagentowy: granice agentów, konta kanałów i powiązania'
title: Trasowanie wieloagentowe
x-i18n:
    generated_at: "2026-07-16T18:20:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 265a1f3d9d9b4957c99c71f391ce4f5abba6b70561570f8bbe8cb9964ece1cfc
    source_path: concepts/multi-agent.md
    workflow: 16
---

Uruchamiaj wielu _izolowanych_ agentów w jednym procesie Gateway, z których każdy ma własny obszar roboczy, katalog stanu (`agentDir`) i historię sesji opartą na SQLite, a także wiele kont kanałów (np. dwa numery WhatsApp). Wiadomości przychodzące są kierowane do właściwego agenta za pomocą **powiązań**.

**Agent** obejmuje pełny zakres przypisany do persony: pliki obszaru roboczego, profile uwierzytelniania, rejestr modeli i magazyn sesji. **Powiązanie** przypisuje konto kanału (obszar roboczy Slack, numer WhatsApp itp.) do jednego z tych agentów.

## Czym jest jeden agent

Każdy agent ma własne:

- **Obszar roboczy**: pliki, `AGENTS.md`/`SOUL.md`/`USER.md`, lokalne notatki, reguły persony.
- **Katalog stanu** (`agentDir`): profile uwierzytelniania, rejestr modeli, konfiguracja agenta.
- **Magazyn sesji**: historia czatów i stan routingu w `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.

Profile uwierzytelniania są przypisane do poszczególnych agentów i odczytywane z:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` to bezpieczniejszy sposób przywoływania informacji między sesjami: zwraca ograniczony, zredagowany widok, a nie pełny zrzut surowego transkryptu. Usuwa sygnatury bloków rozumowania, szczegóły danych wynikowych narzędzi, strukturę pomocniczą `<relevant-memories>`, znaczniki XML wywołań narzędzi (`<tool_call>`, `<function_call>` oraz ich formy mnogie/obniżonej wersji) i kod XML wywołań narzędzi MiniMax, a następnie skraca dane wyjściowe i ogranicza ich rozmiar w bajtach.
</Note>

<Warning>
Nigdy nie używaj ponownie `agentDir` dla różnych agentów — powoduje to kolizje stanu uwierzytelniania i sesji. Gdy lokalne poświadczenie OAuth agenta dodatkowego wygaśnie lub jego odświeżenie się nie powiedzie, OpenClaw odczytuje poświadczenie domyślnego/głównego agenta dla tego samego identyfikatora profilu i przyjmuje najświeższy token, nie kopiując tokenu odświeżania do magazynu agenta dodatkowego. Aby korzystać z całkowicie niezależnego konta OAuth, należy zalogować się z poziomu tego agenta. W przypadku ręcznego kopiowania poświadczeń należy kopiować wyłącznie przenośne statyczne profile `api_key` lub `token` — dane odświeżania OAuth nie są domyślnie przenośne (`copyToAgents` umożliwia jawne włączenie tej funkcji dla profilu).
</Warning>

Skills są ładowane z obszaru roboczego każdego agenta oraz ze współdzielonych katalogów głównych, takich jak `~/.openclaw/skills`, a następnie filtrowane według obowiązującej listy dozwolonych Skills agenta. Użyj `agents.defaults.skills` jako współdzielonej konfiguracji bazowej, a `agents.list[].skills` jako zamiennika dla konkretnego agenta (jawne wpisy zastępują wartości domyślne, a nie są z nimi scalane). Zobacz [Skills: przypisane do agenta a współdzielone](/pl/tools/skills#per-agent-vs-shared-skills) oraz [Skills: listy dozwolone dla agentów](/pl/tools/skills#agent-allowlists).

Magazyn należący do Pluginu podlega konfiguracji tego Pluginu; dodanie drugiego agenta
nie powoduje automatycznego rozdzielenia wszystkich globalnych magazynów Pluginów. Na przykład należy skonfigurować
[sejfy Memory Wiki dla poszczególnych agentów](/pl/concepts/multi-agent#per-agent-memory-wiki-vaults),
gdy persony nie mogą współdzielić skompilowanej wiedzy wiki.

<Note>
**Uwaga dotycząca obszaru roboczego:** obszar roboczy każdego agenta jest **domyślnym katalogiem cwd**, a nie ścisłą piaskownicą. Ścieżki względne są rozwiązywane wewnątrz obszaru roboczego, ale ścieżki bezwzględne mogą uzyskiwać dostęp do innych lokalizacji hosta, jeśli nie włączono izolacji. Zobacz [Izolacja](/pl/gateway/sandboxing).
</Note>

## Ścieżki

| Element                          | Wartość domyślna                                                                      | Nadpisanie                                                                               |
| -------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Konfiguracja                     | `~/.openclaw/openclaw.json`                                                            | `OPENCLAW_CONFIG_PATH`                                                                   |
| Katalog stanu                    | `~/.openclaw`                                                                          | `OPENCLAW_STATE_DIR`                                                                     |
| Obszar roboczy domyślnego agenta | `~/.openclaw/workspace` (lub `workspace-<profile>`, gdy ustawiono `OPENCLAW_PROFILE`)      | `agents.list[].workspace`, następnie `agents.defaults.workspace` albo `OPENCLAW_WORKSPACE_DIR` |
| Obszar roboczy innych agentów    | `<stateDir>/workspace-<agentId>` (lub `<agents.defaults.workspace>/<agentId>`, gdy ustawiono) | `agents.list[].workspace`                                                                |
| Katalog agenta                   | `~/.openclaw/agents/<agentId>/agent`                                                   | `agents.list[].agentDir`                                                                 |
| Sesje i transkrypty              | `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`                             | —                                                                                        |
| Starsze/archiwalne artefakty sesji | `~/.openclaw/agents/<agentId>/sessions`                                                | —                                                                                        |

### Tryb jednego agenta (domyślny)

Jeśli niczego nie skonfigurujesz, OpenClaw uruchamia jednego agenta:

- `agentId` ma domyślnie wartość `main`.
- Kluczem sesji jest `agent:main:<mainKey>` (domyślną wartością `mainKey` jest `main`).
- Domyślnym obszarem roboczym jest `~/.openclaw/workspace` (lub `workspace-<profile>`, gdy `OPENCLAW_PROFILE` ma wartość inną niż `default`).
- Domyślnym katalogiem stanu jest `~/.openclaw/agents/main/agent`.

## Narzędzie pomocnicze agenta

Dodaj nowego izolowanego agenta:

```bash
openclaw agents add work
```

Flagi: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (można powtarzać), `--non-interactive` (wymaga `--workspace`).

Dodaj `bindings`, aby kierować wiadomości przychodzące (kreator zaproponuje wykonanie tej czynności), a następnie zweryfikuj konfigurację:

```bash
openclaw agents list --bindings
```

## Szybki start

<Steps>
  <Step title="Utwórz obszar roboczy każdego agenta">
    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Każdy agent otrzymuje własny obszar roboczy z plikami `SOUL.md`, `AGENTS.md` i opcjonalnym `USER.md`, a także dedykowany `agentDir` oraz magazyn sesji w `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Utwórz konta kanałów">
    Utwórz po jednym koncie dla każdego agenta w preferowanych kanałach:

    - Discord: jeden bot na agenta, włącz Message Content Intent i skopiuj każdy token.
    - Telegram: jeden bot na agenta utworzony przez BotFather; skopiuj każdy token.
    - WhatsApp: połącz każdy numer telefonu z odpowiednim kontem.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Zobacz przewodniki po kanałach: [Discord](/pl/channels/discord), [Telegram](/pl/channels/telegram), [WhatsApp](/pl/channels/whatsapp).

  </Step>
  <Step title="Dodaj agentów, konta i powiązania">
    Dodaj agentów w `agents.list`, konta kanałów w `channels.<channel>.accounts` i połącz je za pomocą `bindings` (przykłady poniżej).
  </Step>
  <Step title="Uruchom ponownie i zweryfikuj">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## Wielu agentów, wiele person

Każdy skonfigurowany `agentId` stanowi odrębną granicę persony dla podstawowego stanu agenta:

- Różne konta w poszczególnych kanałach (według `accountId`).
- Różne osobowości (pliki `AGENTS.md`/`SOUL.md` poszczególnych agentów).
- Oddzielne uwierzytelnianie i sesje, przy czym dostęp między agentami jest włączany wyłącznie za pomocą jawnych funkcji lub konfiguracji Pluginu.

Dzięki temu wiele osób może współdzielić jeden Gateway, zachowując rozdzielenie podstawowego stanu agentów.

## Sejfy Memory Wiki dla poszczególnych agentów

Memory Wiki domyślnie używa jednego globalnego sejfu. Aby skompilowana
wiedza agenta pomocy technicznej była oddzielona od wiedzy agenta marketingowego, ustaw
`plugins.entries.memory-wiki.config.vault.scope` na `agent`:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vault: {
            scope: "agent",
            path: "~/.openclaw/wiki",
          },
        },
      },
    },
  },
}
```

Skonfigurowana ścieżka jest katalogiem nadrzędnym. OpenClaw dołącza znormalizowany
identyfikator agenta, tworząc ścieżki takie jak `~/.openclaw/wiki/support` i
`~/.openclaw/wiki/marketing`. Operacje CLI i Gateway o zakresie agenta wymagają
jawnego wskazania agenta, gdy skonfigurowano wielu agentów. Szczegółowe informacje o
filtrowaniu mostka, migracji i granicach zaufania zawiera sekcja
[Sejfy Memory Wiki dla poszczególnych agentów](/pl/plugins/memory-wiki#per-agent-vaults).

## Wyszukiwanie pamięci QMD między agentami

Aby umożliwić jednemu agentowi przeszukiwanie transkryptów sesji QMD innego agenta, dodaj dodatkowe kolekcje w `agents.list[].memorySearch.qmd.extraCollections`. Użyj `agents.defaults.memorySearch.qmd.extraCollections`, gdy każdy agent powinien współdzielić te same kolekcje.

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
            extraCollections: [{ path: "notes" }], // rozwiązywana wewnątrz obszaru roboczego -> kolekcja o nazwie "notes-main"
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

Ścieżka dodatkowej kolekcji może być współdzielona przez agentów, ale jej `name` pozostaje jawnie określona, gdy ścieżka znajduje się poza obszarem roboczym agenta. Ścieżki wewnątrz obszaru roboczego zachowują zakres agenta, dzięki czemu każdy agent ma własny zestaw przeszukiwanych transkryptów.

## Jeden numer WhatsApp, wiele osób (podział wiadomości prywatnych)

Kieruj wiadomości prywatne WhatsApp od różnych osób do różnych agentów na **jednym** koncie WhatsApp, dopasowując nadawcę E.164 (`+15551234567`) za pomocą `peer.kind: "direct"`. Odpowiedzi nadal pochodzą z tego samego numeru WhatsApp — nie ma oddzielnej tożsamości nadawcy dla każdego agenta.

<Note>
Czaty bezpośrednie są domyślnie scalane z kluczem głównej sesji agenta, dlatego pełna izolacja wymaga jednego agenta na osobę.
</Note>

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

Kontrola dostępu do wiadomości prywatnych (parowanie/lista dozwolonych) jest globalna dla konta WhatsApp, a nie przypisana do agenta. W przypadku współdzielonych grup powiąż grupę z jednym agentem lub użyj [grup rozgłoszeniowych](/pl/channels/broadcast-groups).

## Reguły routingu

Powiązania są deterministyczne, a najbardziej szczegółowe dopasowanie ma pierwszeństwo. Pełną kolejność poziomów (dokładny uczestnik, uczestnik nadrzędny, symbol wieloznaczny uczestnika, serwer+role, serwer, zespół, konto, kanał, domyślny agent) opisano w sekcji [Routing kanałów](/pl/channels/channel-routing#routing-rules-how-an-agent-is-chosen). Warto podkreślić kilka reguł:

- Jeśli na tym samym poziomie pasuje wiele powiązań, pierwszeństwo ma pierwsze z nich w kolejności konfiguracji.
- Jeśli powiązanie określa wiele pól dopasowania (na przykład `peer` + `guildId`), wszystkie wskazane pola muszą być zgodne (semantyka `AND`).
- Powiązanie bez `accountId` pasuje wyłącznie do konta domyślnego, a nie do każdego konta. Użyj `accountId: "*"` jako rezerwowego dopasowania dla całego kanału lub `accountId: "<name>"` dla jednego konta. Ponowne dodanie tego samego powiązania z jawnym identyfikatorem konta aktualizuje istniejące powiązanie obejmujące tylko kanał, zamiast je duplikować.

## Wiele kont / numerów telefonów

Kanały obsługujące wiele kont (np. WhatsApp) używają `accountId` do identyfikowania każdego logowania. Każdy `accountId` kieruje ruch do własnego agenta, dzięki czemu jeden serwer może obsługiwać wiele numerów telefonów bez mieszania sesji.

Ustaw `channels.<channel>.defaultAccount`, aby wybrać konto używane w przypadku pominięcia `accountId`. Jeśli ta wartość nie jest ustawiona, OpenClaw używa `default`, o ile jest dostępne, a w przeciwnym razie pierwszego identyfikatora skonfigurowanego konta (po posortowaniu).

Kanały obsługujące wiele kont: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `mattermost`, `matrix`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `telegram`, `whatsapp`, `zalo`, `zalouser`.

## Pojęcia

- `agentId`: jeden „mózg” (obszar roboczy, uwierzytelnianie osobne dla każdego agenta, magazyn sesji osobny dla każdego agenta).
- `accountId`: jedna instancja konta kanału (np. konto WhatsApp `personal` w odróżnieniu od `biz`).
- `binding`: kieruje wiadomości przychodzące do `agentId` według `(channel, accountId, peer)` oraz opcjonalnie identyfikatorów gildii/zespołu.
- Czaty bezpośrednie są łączone w `agent:<agentId>:<mainKey>` („główną” sesję danego agenta; zob. `session.mainKey`).

## Przykłady dla platform

<AccordionGroup>
  <Accordion title="Boty Discord dla poszczególnych agentów">
    Każde konto bota Discord jest mapowane na unikatowy `accountId`. Powiąż każde konto z agentem i utrzymuj osobne listy dozwolonych dla każdego bota.

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

    - Zaproś każdego bota do gildii i włącz Message Content Intent.
    - Tokeny znajdują się w `channels.discord.accounts.<id>.token` (konto domyślne może używać `DISCORD_BOT_TOKEN`).

  </Accordion>
  <Accordion title="Boty Telegram dla poszczególnych agentów">
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

    - Utwórz po jednym bocie dla każdego agenta za pomocą BotFather i skopiuj każdy token.
    - Tokeny znajdują się w `channels.telegram.accounts.<id>.botToken` (konto domyślne może używać `TELEGRAM_BOT_TOKEN`).
    - W przypadku wielu botów w tej samej grupie Telegram zaproś każdego bota i oznacz tego, który powinien odpowiedzieć.
    - Wyłącz BotFather Privacy Mode dla każdego bota grupowego (`/setprivacy` -> Disable), a następnie usuń i ponownie dodaj bota, aby Telegram zastosował ustawienie.
    - Zezwalaj na grupy za pomocą `channels.telegram.groups` lub używaj `groupPolicy: "open"` wyłącznie we wdrożeniach z zaufanymi grupami.
    - Umieść identyfikatory użytkowników będących nadawcami w `groupAllowFrom`. Identyfikatory grup i supergrup należy umieszczać w `channels.telegram.groups`, a nie w `groupAllowFrom`.
    - Powiąż według `accountId`, aby każdy bot kierował wiadomości do własnego agenta.

  </Accordion>
  <Accordion title="Numery WhatsApp dla poszczególnych agentów">
    Połącz każde konto przed uruchomieniem Gateway:

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

      // Deterministyczne trasowanie: wygrywa pierwsze dopasowanie (najpierw najbardziej szczegółowe).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Opcjonalne nadpisanie dla konkretnego elementu równorzędnego (przykład: skierowanie określonej grupy do agenta służbowego).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // Domyślnie wyłączone: komunikację między agentami trzeba jawnie włączyć i dodać do listy dozwolonych.
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
              // Opcjonalne nadpisanie. Wartość domyślna: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // Opcjonalne nadpisanie. Wartość domyślna: ~/.openclaw/credentials/whatsapp/biz
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
  <Tab title="WhatsApp na co dzień i Telegram do intensywnej pracy">
    Rozdziel według kanału: kieruj WhatsApp do szybkiego agenta codziennego użytku, a Telegram do agenta Opus.

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
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
        { agentId: "opus", match: { channel: "telegram", accountId: "*" } },
      ],
    }
    ```

    W tych przykładach użyto `accountId: "*"`, dzięki czemu powiązania będą nadal działać po późniejszym dodaniu kont. Aby skierować pojedynczą wiadomość bezpośrednią lub grupę do Opus, pozostawiając resztę na czacie, dodaj powiązanie `match.peer` dla tego elementu równorzędnego — dopasowania elementów równorzędnych zawsze mają pierwszeństwo przed regułami obejmującymi cały kanał.

  </Tab>
  <Tab title="Ten sam kanał, jeden element równorzędny kierowany do Opus">
    Pozostaw WhatsApp na szybkim agencie, ale skieruj jedną wiadomość bezpośrednią do Opus:

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
          match: { channel: "whatsapp", accountId: "*", peer: { kind: "direct", id: "+15551234567" } },
        },
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
      ],
    }
    ```

    Powiązania elementów równorzędnych zawsze mają pierwszeństwo, dlatego umieszczaj je nad regułą obejmującą cały kanał.

  </Tab>
  <Tab title="Agent rodzinny powiązany z grupą WhatsApp">
    Powiąż dedykowanego agenta rodzinnego z pojedynczą grupą WhatsApp, wymagając oznaczenia i stosując bardziej restrykcyjną politykę narzędzi:

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

    Listy dozwolonych i zabronionych narzędzi dotyczą **narzędzi**, a nie umiejętności. Jeśli umiejętność musi uruchamiać plik binarny, upewnij się, że `exec` jest dozwolone, a plik binarny istnieje w piaskownicy. Aby zastosować bardziej restrykcyjną kontrolę dostępu, ustaw `agents.list[].groupChat.mentionPatterns` i pozostaw włączone listy dozwolonych grup dla kanału.

  </Tab>
</Tabs>

## Konfiguracja piaskownicy i narzędzi dla poszczególnych agentów

Każdy agent może mieć własną piaskownicę i ograniczenia narzędzi:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // Brak piaskownicy dla agenta osobistego
        },
        // Brak ograniczeń narzędzi — dostępne są wszystkie narzędzia
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
          allow: ["read"],                    // Tylko narzędzie do odczytu
          deny: ["exec", "write", "edit", "apply_patch"],    // Zablokuj pozostałe
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` znajduje się w `sandbox.docker` i jest uruchamiane jednokrotnie podczas tworzenia kontenera. Nadpisania `sandbox.docker.*` dla poszczególnych agentów są ignorowane, gdy wynikowy zakres to `"shared"`.
</Note>

Zapewnia to:

- **Izolację zabezpieczeń**: ograniczenie narzędzi dla niezaufanych agentów.
- **Kontrolę zasobów**: uruchamianie określonych agentów w piaskownicy przy zachowaniu pozostałych na hoście.
- **Elastyczne polityki**: różne uprawnienia dla poszczególnych agentów.

<Note>
`tools.elevated` ma zarówno bramę globalną (`tools.elevated.enabled`/`allowFrom`), jak i bramę dla poszczególnych agentów (`agents.list[].tools.elevated.enabled`/`allowFrom`). Brama dla agenta może jedynie dodatkowo ograniczyć bramę globalną — obie muszą zezwalać nadawcy na uruchamianie poleceń z podwyższonymi uprawnieniami. Do kierowania w grupach używaj `agents.list[].groupChat.mentionPatterns`, aby @wzmianki były jednoznacznie mapowane na właściwego agenta.
</Note>

Szczegółowe przykłady zawiera strona [Piaskownica i narzędzia w konfiguracji wieloagentowej](/pl/tools/multi-agent-sandbox-tools).

## Powiązane

- [Agenci ACP](/pl/tools/acp-agents) — uruchamianie zewnętrznych środowisk programistycznych
- [Routing kanałów](/pl/channels/channel-routing) — sposób kierowania wiadomości do agentów
- [Obecność](/pl/concepts/presence) — obecność i dostępność agentów
- [Sesja](/pl/concepts/session) — izolacja i routing sesji
- [Podagenci](/pl/tools/subagents) — uruchamianie agentów w tle
