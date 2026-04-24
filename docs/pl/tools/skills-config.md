---
read_when:
    - Dodawanie lub modyfikowanie konfiguracji Skills
    - Dostosowywanie wbudowanej listy dozwolonych lub zachowania instalacji
summary: Schemat konfiguracji Skills i przykłady
title: Konfiguracja Skills
x-i18n:
    generated_at: "2026-04-24T09:38:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d5e156adb9b88d7ade1976005c11faffe5107661e4f3da5d878cc0ac648bcbb
    source_path: tools/skills-config.md
    workflow: 15
---

Większość konfiguracji ładowania/instalacji Skills znajduje się pod `skills` w
`~/.openclaw/openclaw.json`. Widoczność Skills specyficzna dla agenta znajduje się pod
`agents.defaults.skills` i `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (runtime Gateway nadal to Node; bun nie jest zalecany)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // albo zwykły string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

W przypadku wbudowanego generowania/edycji obrazów preferuj `agents.defaults.imageGenerationModel`
oraz rdzeniowe narzędzie `image_generate`. `skills.entries.*` służy tylko do niestandardowych lub
zewnętrznych przepływów pracy Skills.

Jeśli wybierzesz konkretnego dostawcę/model obrazu, skonfiguruj także uwierzytelnianie/klucz API
tego dostawcy. Typowe przykłady: `GEMINI_API_KEY` lub `GOOGLE_API_KEY` dla
`google/*`, `OPENAI_API_KEY` dla `openai/*` oraz `FAL_KEY` dla `fal/*`.

Przykłady:

- Natywna konfiguracja w stylu Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- Natywna konfiguracja fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Listy dozwolonych Skills dla agentów

Użyj konfiguracji agenta, gdy chcesz zachować te same korzenie Skills dla maszyny/obszaru roboczego, ale
mieć inny widoczny zestaw Skills dla każdego agenta.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // dziedziczy domyślne -> github, weather
      { id: "docs", skills: ["docs-search"] }, // zastępuje domyślne
      { id: "locked-down", skills: [] }, // brak Skills
    ],
  },
}
```

Zasady:

- `agents.defaults.skills`: współdzielona bazowa lista dozwolonych dla agentów, które pomijają
  `agents.list[].skills`.
- Pominięcie `agents.defaults.skills` pozostawia domyślnie Skills bez ograniczeń.
- `agents.list[].skills`: jawny końcowy zestaw Skills dla tego agenta; nie
  łączy się z domyślnymi.
- `agents.list[].skills: []`: nie udostępnia żadnych Skills dla tego agenta.

## Pola

- Wbudowane korzenie Skills zawsze obejmują `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` oraz `<workspace>/skills`.
- `allowBundled`: opcjonalna lista dozwolonych tylko dla **wbudowanych** Skills. Gdy jest ustawiona, tylko
  wbudowane Skills z listy kwalifikują się (Skills zarządzane, agenta i obszaru roboczego pozostają bez zmian).
- `load.extraDirs`: dodatkowe katalogi Skills do skanowania (najniższy priorytet).
- `load.watch`: obserwuje foldery Skills i odświeża migawkę Skills (domyślnie: true).
- `load.watchDebounceMs`: debounce dla zdarzeń obserwatora Skills w milisekundach (domyślnie: 250).
- `install.preferBrew`: preferuje instalatory brew, gdy są dostępne (domyślnie: true).
- `install.nodeManager`: preferencja instalatora node (`npm` | `pnpm` | `yarn` | `bun`, domyślnie: npm).
  Wpływa to tylko na **instalacje Skills**; runtime Gateway nadal powinien używać Node
  (Bun nie jest zalecany dla WhatsApp/Telegram).
  - `openclaw setup --node-manager` ma węższy zakres i obecnie akceptuje `npm`,
    `pnpm` lub `bun`. Ustaw ręcznie `skills.install.nodeManager: "yarn"`, jeśli
    chcesz instalacje Skills oparte na Yarn.
- `entries.<skillKey>`: nadpisania dla poszczególnych Skills.
- `agents.defaults.skills`: opcjonalna domyślna lista dozwolonych Skills dziedziczona przez agentów,
  które pomijają `agents.list[].skills`.
- `agents.list[].skills`: opcjonalna końcowa lista dozwolonych Skills per agent; jawne
  listy zastępują odziedziczone domyślne zamiast się z nimi łączyć.

Pola dla pojedynczego Skills:

- `enabled`: ustaw `false`, aby wyłączyć Skills nawet wtedy, gdy jest wbudowany/zainstalowany.
- `env`: zmienne środowiskowe wstrzykiwane dla przebiegu agenta (tylko jeśli nie są już ustawione).
- `apiKey`: opcjonalne ułatwienie dla Skills, które deklarują podstawową zmienną środowiskową.
  Obsługuje zwykły string albo obiekt SecretRef (`{ source, provider, id }`).

## Uwagi

- Klucze pod `entries` domyślnie mapują się na nazwę Skills. Jeśli Skills definiuje
  `metadata.openclaw.skillKey`, użyj zamiast tego tego klucza.
- Priorytet ładowania to `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → wbudowane Skills →
  `skills.load.extraDirs`.
- Zmiany w Skills są uwzględniane przy następnej turze agenta, gdy obserwator jest włączony.

### Sandboxowane Skills + zmienne środowiskowe

Gdy sesja jest **sandboxowana**, procesy Skills działają wewnątrz skonfigurowanego
backendu sandbox. Sandbox **nie** dziedziczy hostowego `process.env`.

Użyj jednego z poniższych:

- `agents.defaults.sandbox.docker.env` dla backendu Docker (albo per agent `agents.list[].sandbox.docker.env`)
- wbuduj env do niestandardowego obrazu sandbox lub środowiska zdalnego sandbox

Globalne `env` oraz `skills.entries.<skill>.env/apiKey` mają zastosowanie tylko do uruchomień **na hoście**.

## Powiązane

- [Skills](/pl/tools/skills)
- [Tworzenie Skills](/pl/tools/creating-skills)
- [Polecenia ukośnikowe](/pl/tools/slash-commands)
