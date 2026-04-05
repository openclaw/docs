---
read_when:
    - Dodawanie lub modyfikowanie konfiguracji Skills
    - Dostosowywanie dołączonej allowlist lub zachowania instalacji
summary: Schemat konfiguracji Skills i przykłady
title: Konfiguracja Skills
x-i18n:
    generated_at: "2026-04-05T14:09:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7839f39f68c1442dcf4740b09886e0ef55762ce0d4b9f7b4f493a8c130c84579
    source_path: tools/skills-config.md
    workflow: 15
---

# Konfiguracja Skills

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
      nodeManager: "npm", // npm | pnpm | yarn | bun (środowisko uruchomieniowe Gateway nadal to Node; bun nie jest zalecany)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // lub zwykły ciąg tekstowy
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
oraz podstawowe narzędzie `image_generate`. `skills.entries.*` służy tylko do niestandardowych lub
zewnętrznych przepływów Skill.

Jeśli wybierasz konkretnego dostawcę/model obrazu, skonfiguruj również
uwierzytelnianie/klucz API tego dostawcy. Typowe przykłady: `GEMINI_API_KEY` lub `GOOGLE_API_KEY` dla
`google/*`, `OPENAI_API_KEY` dla `openai/*` oraz `FAL_KEY` dla `fal/*`.

Przykłady:

- Natywna konfiguracja w stylu Nano Banana: `agents.defaults.imageGenerationModel.primary: "google/gemini-3.1-flash-image-preview"`
- Natywna konfiguracja fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Allowlist Skills agenta

Użyj konfiguracji agenta, gdy chcesz mieć te same katalogi główne Skills dla maszyny/workspace, ale
inny widoczny zestaw Skills dla każdego agenta.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // dziedziczy wartości domyślne -> github, weather
      { id: "docs", skills: ["docs-search"] }, // zastępuje wartości domyślne
      { id: "locked-down", skills: [] }, // brak Skills
    ],
  },
}
```

Zasady:

- `agents.defaults.skills`: współdzielona bazowa allowlist dla agentów, które pomijają
  `agents.list[].skills`.
- Pomiń `agents.defaults.skills`, aby domyślnie pozostawić Skills bez ograniczeń.
- `agents.list[].skills`: jawny końcowy zestaw Skills dla tego agenta; nie jest
  scalany z wartościami domyślnymi.
- `agents.list[].skills: []`: nie udostępnia żadnych Skills dla tego agenta.

## Pola

- Wbudowane katalogi główne Skill zawsze obejmują `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` i `<workspace>/skills`.
- `allowBundled`: opcjonalna allowlist tylko dla **dołączonych** Skills. Po ustawieniu tylko
  dołączone Skills z listy kwalifikują się do użycia (zarządzane Skills, Skills agenta i Skills workspace pozostają bez zmian).
- `load.extraDirs`: dodatkowe katalogi Skills do skanowania (najniższy priorytet).
- `load.watch`: obserwuje foldery Skills i odświeża migawkę Skills (domyślnie: true).
- `load.watchDebounceMs`: debounce dla zdarzeń obserwatora Skills w milisekundach (domyślnie: 250).
- `install.preferBrew`: preferuje instalatory brew, gdy są dostępne (domyślnie: true).
- `install.nodeManager`: preferowany menedżer instalacji Node (`npm` | `pnpm` | `yarn` | `bun`, domyślnie: npm).
  Wpływa to tylko na **instalacje Skill**; środowisko uruchomieniowe Gateway powinno nadal być Node
  (Bun nie jest zalecany dla WhatsApp/Telegram).
  - `openclaw setup --node-manager` jest węższe i obecnie akceptuje `npm`,
    `pnpm` lub `bun`. Ustaw ręcznie `skills.install.nodeManager: "yarn"`, jeśli
    chcesz instalacje Skill oparte na Yarn.
- `entries.<skillKey>`: nadpisania dla poszczególnych Skill.
- `agents.defaults.skills`: opcjonalna domyślna allowlist Skills dziedziczona przez agentów,
  które pomijają `agents.list[].skills`.
- `agents.list[].skills`: opcjonalna końcowa allowlist Skills per agent; jawne
  listy zastępują odziedziczone wartości domyślne zamiast je scalać.

Pola dla poszczególnych Skill:

- `enabled`: ustaw `false`, aby wyłączyć Skill, nawet jeśli jest dołączony/zainstalowany.
- `env`: zmienne środowiskowe wstrzykiwane do uruchomienia agenta (tylko jeśli nie są już ustawione).
- `apiKey`: opcjonalne ułatwienie dla Skills, które deklarują podstawową zmienną środowiskową.
  Obsługuje zwykły ciąg tekstowy lub obiekt SecretRef (`{ source, provider, id }`).

## Uwagi

- Klucze pod `entries` domyślnie mapują się na nazwę Skill. Jeśli Skill definiuje
  `metadata.openclaw.skillKey`, użyj zamiast tego tego klucza.
- Priorytet ładowania to `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → dołączone Skills →
  `skills.load.extraDirs`.
- Zmiany w Skills są wykrywane przy następnej turze agenta, gdy obserwator jest włączony.

### Skills w sandbox + zmienne środowiskowe

Gdy sesja jest **sandboxed**, procesy Skill działają wewnątrz Dockera. Sandbox
**nie** dziedziczy hostowego `process.env`.

Użyj jednego z poniższych:

- `agents.defaults.sandbox.docker.env` (lub per agent `agents.list[].sandbox.docker.env`)
- osadź `env` we własnym niestandardowym obrazie sandbox

Globalne `env` i `skills.entries.<skill>.env/apiKey` mają zastosowanie tylko do uruchomień **na hoście**.
