---
read_when:
    - Dodawanie lub modyfikowanie konfiguracji Skills
    - Dostosowywanie bundlowanej allowlisty lub zachowania instalacji
summary: Schemat konfiguracji Skills i przykłady
title: Konfiguracja Skills
x-i18n:
    generated_at: "2026-04-21T10:01:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8af3a51af5d6d6af355c529bb8ec0a045046c635d8fff0dec20cd875ec12e88b
    source_path: tools/skills-config.md
    workflow: 15
---

# Konfiguracja Skills

Większość konfiguracji ładowania/instalacji Skills znajduje się w `skills` w
`~/.openclaw/openclaw.json`. Widoczność Skills specyficzna dla agenta znajduje się w
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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // lub zwykły ciąg znaków
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

Dla wbudowanego generowania/edycji obrazów preferuj `agents.defaults.imageGenerationModel`
plus główne narzędzie `image_generate`. `skills.entries.*` służy tylko do własnych lub
zewnętrznych workflow Skills.

Jeśli wybierasz konkretnego dostawcę/model obrazu, skonfiguruj także
uwierzytelnianie/klucz API tego dostawcy. Typowe przykłady: `GEMINI_API_KEY` lub `GOOGLE_API_KEY` dla
`google/*`, `OPENAI_API_KEY` dla `openai/*` oraz `FAL_KEY` dla `fal/*`.

Przykłady:

- Natywna konfiguracja w stylu Nano Banana: `agents.defaults.imageGenerationModel.primary: "google/gemini-3.1-flash-image-preview"`
- Natywna konfiguracja fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Allowlists Skills agentów

Użyj konfiguracji agenta, gdy chcesz mieć te same katalogi główne Skills dla maszyny/workspace, ale
inny widoczny zestaw Skills dla każdego agenta.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // dziedziczy domyślne -> github, weather
      { id: "docs", skills: ["docs-search"] }, // zastępuje domyślne
      { id: "locked-down", skills: [] }, // bez Skills
    ],
  },
}
```

Zasady:

- `agents.defaults.skills`: współdzielona bazowa allowlista dla agentów, które pomijają
  `agents.list[].skills`.
- Pomiń `agents.defaults.skills`, aby domyślnie pozostawić Skills bez ograniczeń.
- `agents.list[].skills`: jawny końcowy zestaw Skills dla tego agenta; nie
  łączy się z domyślnymi.
- `agents.list[].skills: []`: nie udostępnia żadnych Skills dla tego agenta.

## Pola

- Wbudowane katalogi główne Skills zawsze obejmują `~/.openclaw/skills`, `~/.agents/skills`,
  `<workspace>/.agents/skills` i `<workspace>/skills`.
- `allowBundled`: opcjonalna allowlista tylko dla **bundlowanych** Skills. Gdy jest ustawiona, tylko
  bundlowane Skills z listy są kwalifikowane (nie wpływa na zarządzane Skills, agenta i workspace).
- `load.extraDirs`: dodatkowe katalogi Skills do skanowania (najniższy priorytet).
- `load.watch`: obserwuj foldery Skills i odświeżaj migawkę Skills (domyślnie: true).
- `load.watchDebounceMs`: debounce dla zdarzeń watchera Skills w milisekundach (domyślnie: 250).
- `install.preferBrew`: preferuj instalatory brew, gdy są dostępne (domyślnie: true).
- `install.nodeManager`: preferencja instalatora node (`npm` | `pnpm` | `yarn` | `bun`, domyślnie: npm).
  Wpływa to tylko na **instalacje Skills**; runtime Gateway nadal powinien być Node
  (Bun nie jest zalecany dla WhatsApp/Telegram).
  - `openclaw setup --node-manager` jest węższe i obecnie akceptuje `npm`,
    `pnpm` lub `bun`. Ustaw ręcznie `skills.install.nodeManager: "yarn"`, jeśli
    chcesz instalacji Skills opartych na Yarn.
- `entries.<skillKey>`: nadpisania per Skill.
- `agents.defaults.skills`: opcjonalna domyślna allowlista Skills dziedziczona przez agentów,
  które pomijają `agents.list[].skills`.
- `agents.list[].skills`: opcjonalna końcowa allowlista Skills per agent; jawne
  listy zastępują dziedziczone domyślne zamiast się z nimi łączyć.

Pola per Skill:

- `enabled`: ustaw `false`, aby wyłączyć Skill nawet jeśli jest bundlowany/zainstalowany.
- `env`: zmienne środowiskowe wstrzykiwane dla uruchomienia agenta (tylko jeśli nie są już ustawione).
- `apiKey`: opcjonalne ułatwienie dla Skills, które deklarują podstawową zmienną env.
  Obsługuje zwykły ciąg znaków lub obiekt SecretRef (`{ source, provider, id }`).

## Uwagi

- Klucze w `entries` domyślnie mapują się na nazwę Skill. Jeśli Skill definiuje
  `metadata.openclaw.skillKey`, użyj zamiast tego tego klucza.
- Priorytet ładowania to `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → bundlowane Skills →
  `skills.load.extraDirs`.
- Zmiany w Skills są wykrywane przy następnej turze agenta, gdy watcher jest włączony.

### Skills w sandbox + zmienne env

Gdy sesja jest **sandboxed**, procesy Skills działają wewnątrz skonfigurowanego
backendu sandbox. Sandbox **nie** dziedziczy host `process.env`.

Użyj jednego z poniższych:

- `agents.defaults.sandbox.docker.env` dla backendu Docker (lub per agent `agents.list[].sandbox.docker.env`)
- wbuduj env do własnego obrazu sandbox albo zdalnego środowiska sandbox

Globalne `env` i `skills.entries.<skill>.env/apiKey` mają zastosowanie tylko do uruchomień na **hoście**.
