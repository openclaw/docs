---
read_when:
    - Wprowadzanie nowej instancji asystenta
    - Przegląd implikacji dotyczących bezpieczeństwa/uprawnień
summary: Kompletny przewodnik po uruchamianiu OpenClaw jako osobistego asystenta z ostrzeżeniami dotyczącymi bezpieczeństwa
title: Konfiguracja asystenta osobistego
x-i18n:
    generated_at: "2026-05-11T20:37:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 74dd13c4b43faa8e29e1fd56a355f36c6cf7c3fa8193bb62c1056211933f4df9
    source_path: start/openclaw.md
    workflow: 16
---

OpenClaw to samodzielnie hostowany gateway, który łączy Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo i inne kanały z agentami AI. Ten przewodnik opisuje konfigurację „osobistego asystenta”: dedykowany numer WhatsApp, który działa jak Twój zawsze dostępny asystent AI.

## ⚠️ Najpierw bezpieczeństwo

Umieszczasz agenta w pozycji, w której może:

- uruchamiać polecenia na Twojej maszynie (zależnie od polityki narzędzi)
- odczytywać/zapisywać pliki w Twoim obszarze roboczym
- wysyłać wiadomości z powrotem przez WhatsApp/Telegram/Discord/Mattermost i inne dołączone kanały

Zacznij ostrożnie:

- Zawsze ustaw `channels.whatsapp.allowFrom` (nigdy nie uruchamiaj konfiguracji otwartej na cały świat na swoim osobistym Macu).
- Używaj dedykowanego numeru WhatsApp dla asystenta.
- Heartbeats domyślnie działają teraz co 30 minut. Wyłącz je, dopóki nie zaufasz konfiguracji, ustawiając `agents.defaults.heartbeat.every: "0m"`.

## Wymagania wstępne

- Zainstalowany i skonfigurowany OpenClaw - jeśli jeszcze tego nie zrobiono, zobacz [Pierwsze kroki](/pl/start/getting-started)
- Drugi numer telefonu (SIM/eSIM/prepaid) dla asystenta

## Konfiguracja z dwoma telefonami (zalecana)

Docelowo chcesz mieć to:

```mermaid
flowchart TB
    A["<b>Your Phone (personal)<br></b><br>Your WhatsApp<br>+1-555-YOU"] -- message --> B["<b>Second Phone (assistant)<br></b><br>Assistant WA<br>+1-555-ASSIST"]
    B -- linked via QR --> C["<b>Your Mac (openclaw)<br></b><br>AI agent"]
```

Jeśli połączysz swój osobisty WhatsApp z OpenClaw, każda wiadomość do Ciebie stanie się „wejściem agenta”. Rzadko jest to tym, czego chcesz.

## Szybki start w 5 minut

1. Sparuj WhatsApp Web (pokazuje QR; zeskanuj go telefonem asystenta):

```bash
openclaw channels login
```

2. Uruchom Gateway (zostaw go działającego):

```bash
openclaw gateway --port 18789
```

3. Umieść minimalną konfigurację w `~/.openclaw/openclaw.json`:

```json5
{
  gateway: { mode: "local" },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

Teraz wyślij wiadomość na numer asystenta ze swojego telefonu z listy dozwolonych.

Po zakończeniu onboardingu OpenClaw automatycznie otwiera panel i wypisuje czysty link (bez tokenu). Jeśli panel poprosi o uwierzytelnienie, wklej skonfigurowany współdzielony sekret w ustawieniach Control UI. Onboarding domyślnie używa tokenu (`gateway.auth.token`), ale uwierzytelnianie hasłem też działa, jeśli przełączono `gateway.auth.mode` na `password`. Aby otworzyć ponownie później: `openclaw dashboard`.

## Daj agentowi obszar roboczy (AGENTS)

OpenClaw odczytuje instrukcje operacyjne i „pamięć” ze swojego katalogu obszaru roboczego.

Domyślnie OpenClaw używa `~/.openclaw/workspace` jako obszaru roboczego agenta i utworzy go (plus startowe `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`) automatycznie podczas konfiguracji/pierwszego uruchomienia agenta. `BOOTSTRAP.md` jest tworzony tylko wtedy, gdy obszar roboczy jest zupełnie nowy (nie powinien wracać po usunięciu). `MEMORY.md` jest opcjonalny (nie jest tworzony automatycznie); jeśli istnieje, jest ładowany dla normalnych sesji. Sesje subagentów wstrzykują tylko `AGENTS.md` i `TOOLS.md`.

<Tip>
Traktuj ten folder jak pamięć OpenClaw i utwórz z niego repozytorium git (najlepiej prywatne), aby Twoje `AGENTS.md` i pliki pamięci miały kopię zapasową. Jeśli git jest zainstalowany, zupełnie nowe obszary robocze są automatycznie inicjalizowane.
</Tip>

```bash
openclaw setup
```

Pełny układ obszaru roboczego + przewodnik po kopiach zapasowych: [Obszar roboczy agenta](/pl/concepts/agent-workspace)
Przepływ pracy z pamięcią: [Pamięć](/pl/concepts/memory)

Opcjonalnie: wybierz inny obszar roboczy za pomocą `agents.defaults.workspace` (obsługuje `~`).

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

Jeśli już dostarczasz własne pliki obszaru roboczego z repozytorium, możesz całkowicie wyłączyć tworzenie plików bootstrap:

```json5
{
  agents: {
    defaults: {
      skipBootstrap: true,
    },
  },
}
```

## Konfiguracja, która zamienia go w „asystenta”

OpenClaw domyślnie ma dobrą konfigurację asystenta, ale zwykle warto dostroić:

- personę/instrukcje w [`SOUL.md`](/pl/concepts/soul)
- domyślne ustawienia myślenia (jeśli potrzeba)
- heartbeats (gdy już mu zaufasz)

Przykład:

```json5
{
  logging: { level: "info" },
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      workspace: "~/.openclaw/workspace",
      thinkingDefault: "high",
      timeoutSeconds: 1800,
      // Start with 0; enable later.
      heartbeat: { every: "0m" },
    },
    list: [
      {
        id: "main",
        default: true,
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw"],
        },
      },
    ],
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  session: {
    scope: "per-sender",
    resetTriggers: ["/new", "/reset"],
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 10080,
    },
  },
}
```

## Sesje i pamięć

- Pliki sesji: `~/.openclaw/agents/<agentId>/sessions/{{SessionId}}.jsonl`
- Metadane sesji (użycie tokenów, ostatnia trasa itd.): `~/.openclaw/agents/<agentId>/sessions/sessions.json` (starsze: `~/.openclaw/sessions/sessions.json`)
- `/new` lub `/reset` rozpoczyna świeżą sesję dla tego czatu (konfigurowalne przez `resetTriggers`). Jeśli zostanie wysłane samodzielnie, OpenClaw potwierdza reset bez wywoływania modelu.
- `/compact [instructions]` kompaktuje kontekst sesji i zgłasza pozostały budżet kontekstu.

## Heartbeats (tryb proaktywny)

Domyślnie OpenClaw uruchamia heartbeat co 30 minut z promptem:
`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
Ustaw `agents.defaults.heartbeat.every: "0m"`, aby wyłączyć.

- Jeśli `HEARTBEAT.md` istnieje, ale jest praktycznie pusty (tylko puste linie i nagłówki markdown, takie jak `# Heading`), OpenClaw pomija uruchomienie heartbeat, aby oszczędzać wywołania API.
- Jeśli pliku brakuje, heartbeat nadal działa, a model decyduje, co zrobić.
- Jeśli agent odpowie `HEARTBEAT_OK` (opcjonalnie z krótkim wypełnieniem; zobacz `agents.defaults.heartbeat.ackMaxChars`), OpenClaw blokuje dostarczenie wychodzące dla tego heartbeat.
- Domyślnie dostarczanie heartbeat do celów DM w stylu `user:<id>` jest dozwolone. Ustaw `agents.defaults.heartbeat.directPolicy: "block"`, aby zablokować dostarczanie do celów bezpośrednich, pozostawiając uruchomienia heartbeat aktywne.
- Heartbeats uruchamiają pełne tury agenta - krótsze interwały zużywają więcej tokenów.

```json5
{
  agents: {
    defaults: {
      heartbeat: { every: "30m" },
    },
  },
}
```

## Multimedia przychodzące i wychodzące

Załączniki przychodzące (obrazy/audio/dokumenty) mogą być przekazywane do Twojego polecenia przez szablony:

- `{{MediaPath}}` (lokalna ścieżka pliku tymczasowego)
- `{{MediaUrl}}` (pseudo-URL)
- `{{Transcript}}` (jeśli transkrypcja audio jest włączona)

Załączniki wychodzące od agenta: umieść `MEDIA:<path-or-url>` w osobnej linii (bez spacji). Przykład:

```
Here's the screenshot.
MEDIA:https://example.com/screenshot.png
```

OpenClaw wyodrębnia je i wysyła jako multimedia razem z tekstem.

Zachowanie ścieżek lokalnych podąża za tym samym modelem zaufania odczytu plików co agent:

- Jeśli `tools.fs.workspaceOnly` ma wartość `true`, lokalne ścieżki wychodzące `MEDIA:` pozostają ograniczone do tymczasowego katalogu głównego OpenClaw, pamięci podręcznej multimediów, ścieżek obszaru roboczego agenta i plików wygenerowanych w piaskownicy.
- Jeśli `tools.fs.workspaceOnly` ma wartość `false`, wychodzące `MEDIA:` może używać lokalnych plików hosta, które agent już może odczytywać.
- Ścieżki lokalne mogą być bezwzględne, względne względem obszaru roboczego albo względne względem katalogu domowego z `~/`.
- Wysyłki lokalne z hosta nadal dopuszczają tylko multimedia i bezpieczne typy dokumentów (obrazy, audio, wideo, PDF oraz dokumenty Office). Zwykły tekst i pliki przypominające sekrety nie są traktowane jako multimedia możliwe do wysłania.

Oznacza to, że wygenerowane obrazy/pliki poza obszarem roboczym mogą teraz zostać wysłane, gdy Twoja polityka fs już pozwala na takie odczyty, bez ponownego otwierania dowolnej eksfiltracji załączników tekstowych z hosta.

## Lista kontrolna operacji

```bash
openclaw status          # local status (creds, sessions, queued events)
openclaw status --all    # full diagnosis (read-only, pasteable)
openclaw status --deep   # asks the gateway for a live health probe with channel probes when supported
openclaw health --json   # gateway health snapshot (WS; default can return a fresh cached snapshot)
```

Logi znajdują się w `/tmp/openclaw/` (domyślnie: `openclaw-YYYY-MM-DD.log`).

## Następne kroki

- WebChat: [WebChat](/pl/web/webchat)
- Operacje Gateway: [Runbook Gateway](/pl/gateway)
- Cron + wybudzenia: [Zadania Cron](/pl/automation/cron-jobs)
- Towarzysz paska menu macOS: [Aplikacja OpenClaw dla macOS](/pl/platforms/macos)
- Aplikacja węzła iOS: [Aplikacja iOS](/pl/platforms/ios)
- Aplikacja węzła Android: [Aplikacja Android](/pl/platforms/android)
- Status Windows: [Windows (WSL2)](/pl/platforms/windows)
- Status Linux: [Aplikacja Linux](/pl/platforms/linux)
- Bezpieczeństwo: [Bezpieczeństwo](/pl/gateway/security)

## Powiązane

- [Pierwsze kroki](/pl/start/getting-started)
- [Konfiguracja](/pl/start/setup)
- [Przegląd kanałów](/pl/channels)
